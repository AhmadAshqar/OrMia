import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

// Import Firebase functions
import { 
  db, 
  storage 
} from '@/lib/firebase';

import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  collectionGroup
} from 'firebase/firestore';

import { 
  createMessage as createFirebaseMessage, 
  FirebaseMessage, 
  getAllMessages, 
  markMessageAsRead, 
  getOrderMessages,
  getAllOrdersWithMessages,
  uploadMessageImage as uploadOrderImage,
  getOrderConversations,
  OrderSummary,
  createTestMessage
} from '@/lib/firebaseMessages';

import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Message } from '@shared/schema';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ImageUploader } from '@/components/ui/ImageUploader';

// Interface for chat thread messages
interface ThreadMessage {
  id: number;
  content: string;
  createdAt: Date;
  isFromAdmin: boolean;
  userId: number;
  imageUrl: string | null;
  orderId?: number | null;
}

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [firebaseMessages, setFirebaseMessages] = useState<FirebaseMessage[]>([]);
  const [orderConversations, setOrderConversations] = useState<OrderSummary[]>([]);
  const websocketRef = useRef<WebSocket | null>(null);
  // Removed messagesEndRef as we're using container IDs for scrolling

  // Query to fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    }
  });

  // Query to fetch unread messages with optional user filtering
  const { data: unreadMessages, isLoading: isLoadingUnread } = useQuery({
    queryKey: ['/api/admin/messages/unread', selectedUserId],
    queryFn: async () => {
      const url = selectedUserId 
        ? `/api/admin/messages/unread?userId=${selectedUserId}` 
        : '/api/admin/messages/unread';
      const response = await apiRequest('GET', url);
      return response.json();
    }
  });

  // Query to fetch all messages for current user or admin view
  const { data: allMessages, isLoading: isLoadingAllMessages } = useQuery({
    queryKey: ['/api/admin/messages', selectedUserId],
    queryFn: async () => {
      const url = selectedUserId 
        ? `/api/admin/messages?userId=${selectedUserId}` 
        : '/api/admin/messages';
      const response = await apiRequest('GET', url);
      return response.json();
    }
  });

  // Query to fetch order messages if an order is selected
  const { data: orderMessages, isLoading: isLoadingOrderMessages } = useQuery({
    queryKey: ['/api/orders', selectedOrderId, 'messages'],
    queryFn: async () => {
      if (!selectedOrderId) return [];
      const response = await apiRequest('GET', `/api/orders/${selectedOrderId}/messages`);
      return response.json();
    },
    enabled: !!selectedOrderId
  });

  // Query to fetch orders for the dropdown
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/orders');
      return response.json();
    }
  });

  // Mutation to mark a message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest('PATCH', `/api/messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages/unread'] });
      if (selectedOrderId) {
        queryClient.invalidateQueries({ queryKey: ['/api/orders', selectedOrderId, 'messages'] });
      }
    },
    onError: (error) => {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לסמן את ההודעה כנקראה',
        variant: 'destructive'
      });
    }
  });

  // Mutation to reply to a message
  const replyMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: number; content: string }) => {
      const response = await apiRequest('POST', `/api/messages/${messageId}/reply`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/messages/unread'] });
      if (selectedOrderId && selectedOrderId !== 'all') {
        queryClient.invalidateQueries({ queryKey: ['/api/orders', selectedOrderId, 'messages'] });
      }
      setReplyContent('');
      toast({
        title: 'הודעה נשלחה',
        description: 'התשובה שלך נשלחה בהצלחה'
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשלוח את התשובה',
        variant: 'destructive'
      });
    }
  });

  // Effect to handle WebSocket connection
  useEffect(() => {
    if (!user) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    websocketRef.current = socket;
    
    // Connection opened
    socket.addEventListener("open", () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
      
      // Authenticate with the server
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id,
        isAdmin: true
      }));
    });
    
    // Listen for messages
    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        
        if (data.type === 'welcome') {
          console.log(data.message);
        }
        else if (data.type === 'auth_response') {
          if (data.success) {
            console.log("WebSocket authentication successful");
            
            // If we have a selected message, subscribe to its updates
            if (selectedMessage?.orderId) {
              socket.send(JSON.stringify({
                type: 'subscribe',
                orderId: selectedMessage.orderId
              }));
            }
          } else {
            console.error("WebSocket authentication failed:", data.message);
            toast({
              title: "שגיאה",
              description: "נכשלה ההתחברות לשרת הצ'אט",
              variant: "destructive"
            });
          }
        }
        else if (data.type === 'history') {
          // Update the selected message with the latest messages
          if (selectedMessage && selectedMessage.orderId === data.orderId) {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/messages/unread'] });
            queryClient.invalidateQueries({ queryKey: ['/api/orders', selectedMessage.orderId, 'messages'] });
          }
        }
        else if (data.type === 'new_message') {
          // Update the selected message with the new message
          if (selectedMessage && selectedMessage.orderId === data.message.orderId) {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/messages/unread'] });
            queryClient.invalidateQueries({ queryKey: ['/api/orders', selectedMessage.orderId, 'messages'] });
            
            // Scroll to the bottom of the messages
            setTimeout(() => {
              const chatContainer = document.getElementById('admin-chat-container');
              if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
              }
            }, 100);
          }
        }
        else if (data.type === 'message_read') {
          // Update the message read status
          queryClient.invalidateQueries({ queryKey: ['/api/admin/messages'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/messages/unread'] });
          if (selectedMessage?.orderId) {
            queryClient.invalidateQueries({ queryKey: ['/api/orders', selectedMessage.orderId, 'messages'] });
          }
        }
        else if (data.type === 'error') {
          console.error("WebSocket error:", data.message);
          toast({
            title: "שגיאה",
            description: data.message,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
    
    // Connection closed
    socket.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event);
      setIsConnected(false);
      
      // Try to reconnect after a delay
      setTimeout(() => {
        if (websocketRef.current === socket) {
          websocketRef.current = null;
        }
      }, 3000);
    });
    
    // Connection error
    socket.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהתחברות לשרת הצ'אט",
        variant: "destructive"
      });
    });
    
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      if (websocketRef.current === socket) {
        websocketRef.current = null;
      }
    };
  }, [user]);
  
  // Effect to handle message selection
  useEffect(() => {
    if (!selectedMessage) return;
    
    // Mark the message as read
    if (!selectedMessage.isRead) {
      markAsReadMutation.mutate(selectedMessage.id);
    }
    
    // Subscribe to the order's messages via WebSocket
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN && selectedMessage.orderId) {
      websocketRef.current.send(JSON.stringify({
        type: 'subscribe',
        orderId: selectedMessage.orderId
      }));
    }
    
    // Scroll to the bottom of the chat container
    setTimeout(() => {
      const chatContainer = document.getElementById('admin-chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }, [selectedMessage]);

  // Handle message click
  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    setSelectedImage(null);
    
    // If the message has an orderId, mark any Firebase messages for this order as read
    if (message.orderId) {
      // Filter for Firebase messages for this order
      const unreadMessages = firebaseMessages.filter(msg => 
        msg.orderId === message.orderId && !msg.isAdmin && !msg.isRead
      );
      
      // Use batch update to mark all unread messages as read at once
      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages
          .filter(msg => msg.id)
          .map(msg => msg.id as string);
        
        if (messageIds.length > 0) {
          markMessageAsRead(messageIds, message.orderId)
            .catch(error => console.error("Error marking messages as read:", error));
        }
      }
    }
  };
  
  // Handle order click
  const handleOrderClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    
    // Mark all unread messages for this order as read
    const unreadMessages = firebaseMessages.filter(msg => 
      msg.orderId === orderId && !msg.isAdmin && !msg.isRead
    );
    
    // Use batch update to mark all unread messages as read at once
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages
        .filter(msg => msg.id)
        .map(msg => msg.id as string);
      
      if (messageIds.length > 0) {
        markMessageAsRead(messageIds, orderId)
          .catch(error => console.error("Error marking messages as read:", error));
      }
    }
  };
  
  // Direct Firebase test message - creates a guaranteed message in Firebase
  const handleDirectTestMessage = async () => {
    if (!user) return;
    
    try {
      const orderId = 10; // Test with order 10
      
      console.log("--- CREATING TEST MESSAGE ---");
      console.log("User:", user);
      console.log("Order ID:", orderId);
      
      // STEP 1: Use the simpler, more direct approach with new timestamp
      const timestamp = new Date().toISOString();
      
      // Create test message via our API endpoint for maximum reliability
      const response = await apiRequest("POST", "/api/test-message", {
        orderId,
        content: `Test message via API at ${timestamp}`,
        isAdmin: true
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("Test message created via API:", result);
        
        toast({
          title: 'הודעת בדיקה נוצרה',
          description: `הודעה נוצרה בהצלחה להזמנה ${orderId} דרך ה-API`
        });
      } else {
        // FALLBACK: If API approach fails, try direct Firebase
        console.log("API approach failed, trying direct Firebase insertion");
        
        // Create a direct message in Firebase
        const orderRef = doc(db, 'orders', orderId.toString());
        
        // First ensure the order doc exists
        await setDoc(orderRef, { 
          exists: true, 
          updatedAt: timestamp,
          testOrder: true,
          version: "direct-firebase-v2"
        }, { merge: true });
        console.log("Order document created/updated successfully");
        
        // Then create the message directly - using a unique content to identify this message
        const messagesCollection = collection(orderRef, 'messages');
        const uniqueId = Math.random().toString(36).substring(2, 8);
        const messageData = {
          content: `Direct test message created at ${timestamp} [ID: ${uniqueId}]`,
          orderId: orderId,
          userId: user.id,
          isAdmin: true,
          isRead: false,
          createdAt: serverTimestamp(),
          testMessage: true
        };
        
        console.log("About to create message with data:", {...messageData, createdAt: "(serverTimestamp)"});
        const docRef = await addDoc(messagesCollection, messageData);
        console.log("Message created successfully with ID:", docRef.id);
        
        toast({
          title: 'הודעה נוצרה',
          description: `הודעת בדיקה נוצרה ישירות בפיירבייס להזמנה ${orderId}`
        });
      }
      
      // Force refresh the messages
      setTimeout(() => {
        console.log("Forcing refresh of message lists");
        
        // Refresh regardless of selected order
        const tempId = selectedOrderId;
        setSelectedOrderId(null);
        setTimeout(() => {
          if (tempId === orderId) {
            setSelectedOrderId(tempId);
          } else {
            setSelectedOrderId(orderId);
          }
        }, 100);
      }, 1000);
      
    } catch (error) {
      console.error("Error creating test message:", error);
      toast({
        title: 'שגיאה',
        description: `לא ניתן ליצור הודעת בדיקה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
        variant: 'destructive'
      });
    }
  };

  // Effect to listen for all Firebase messages
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = getAllMessages((messages) => {
      setFirebaseMessages(messages);
    });
    
    return () => {
      unsubscribe();
    };
  }, [user]);

  // Effect to get all orders with messages
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to real-time order conversations updates
    console.log("Setting up getOrderConversations subscription");
    const unsubscribe = getOrderConversations((orders) => {
      console.log("Received order conversations:", orders);
      setOrderConversations(orders);
    });
    
    return () => {
      console.log("Cleaning up getOrderConversations subscription");
      unsubscribe();
    };
  }, [user]);
  
  // Effect to listen for order-specific Firebase messages when an order is selected
  const [orderFirebaseMessages, setOrderFirebaseMessages] = useState<FirebaseMessage[]>([]);
  
  useEffect(() => {
    if (!selectedOrderId || selectedOrderId === 'all') return;
    
    // Convert to number if it's a string
    const orderId = typeof selectedOrderId === 'string' 
      ? parseInt(selectedOrderId) 
      : selectedOrderId;
    
    // Get messages for specific order
    const unsubscribe = getOrderMessages(orderId, (messages) => {
      setOrderFirebaseMessages(messages);
      
      // Scroll to the bottom when messages update
      setTimeout(() => {
        const chatContainer = document.getElementById('admin-chat-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    });
    
    return () => {
      unsubscribe();
    };
  }, [selectedOrderId]);

  // Handle reply submit with Firebase
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check if we're in order view or message view
    const targetOrderId = selectedOrderId || (selectedMessage?.orderId);
    
    if (!targetOrderId) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור הזמנה או הודעה',
        variant: 'destructive'
      });
      return;
    }
    
    if (!replyContent.trim() && !selectedImage) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין תוכן להודעה או לבחור תמונה',
        variant: 'destructive'
      });
      return;
    }
    
    // Store the message content before clearing it
    const messageContent = replyContent;
    const imageContent = selectedImage;
    
    // Clear the input immediately for better UX
    setReplyContent('');
    setSelectedImage(null);
    
    try {
      // Send message through Firebase
      if (user) {
        await createFirebaseMessage({
          content: messageContent,
          orderId: typeof targetOrderId === 'string' ? parseInt(targetOrderId) : targetOrderId,
          userId: user.id,
          isAdmin: true,
          isRead: true, // Admin's messages are always read
          imageUrl: imageContent || undefined
        });
        
        // Mark any unread Firebase messages for this order as read
        const unreadUserMessages = firebaseMessages.filter(msg => 
          msg.orderId === targetOrderId && !msg.isAdmin && !msg.isRead
        );
        
        // Use batch update to mark all unread messages as read at once
        if (unreadUserMessages.length > 0) {
          const messageIds = unreadUserMessages
            .filter(msg => msg.id)
            .map(msg => msg.id as string);
          
          if (messageIds.length > 0) {
            await markMessageAsRead(messageIds, 
              typeof targetOrderId === 'string' ? parseInt(targetOrderId) : targetOrderId
            );
          }
        }
        
        toast({
          title: 'הודעה נשלחה',
          description: 'ההודעה שלך נשלחה בהצלחה'
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשלוח את ההודעה',
        variant: 'destructive'
      });
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setReplyContent(replyContent + emoji);
  };
  
  // Handle image upload
  const handleImageUploaded = async (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };
  
  // Filter messages for search
  const filteredMessages = allMessages ? allMessages.filter((message: Message) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      message.subject?.toLowerCase().includes(searchLower) ||
      message.content?.toLowerCase().includes(searchLower) ||
      message.user?.username?.toLowerCase().includes(searchLower) ||
      message.user?.email?.toLowerCase().includes(searchLower)
    );
  }) : [];

  // Filter messages by conversation (grouped by user)
  const getMessagesForSelectedUser = (messages: Message[]) => {
    if (!selectedUserId || !messages) return [];
    return messages.filter((message) => message.userId === selectedUserId);
  };
  
  // Filter messages by order
  const getMessagesForSelectedOrder = (messages: FirebaseMessage[]) => {
    if (!selectedOrderId || !messages) return [];
    return messages.filter((message) => message.orderId === selectedOrderId);
  };

  // Determine which messages to display based on the active tab
  const getActiveMessages = (tabValue: string) => {
    if (tabValue === 'unread' && unreadMessages) {
      return unreadMessages;
    } else if (tabValue === 'search' && allMessages) {
      return filteredMessages;
    } else if (tabValue === 'chat' && allMessages) {
      return selectedUserId ? getMessagesForSelectedUser(allMessages) : allMessages;
    } else if (tabValue === 'orders' && orderMessages) {
      return orderMessages;
    }
    return [];
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>ניהול הודעות - אור מיה</title>
      </Helmet>
      <div className="container mx-auto py-6 px-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>ניהול הודעות</CardTitle>
            <CardDescription>
              צפייה וניהול הודעות מלקוחות
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="orders" className="w-full">
              
              <TabsContent value="unread">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 border rounded-lg overflow-hidden h-[600px]">
                    {isLoadingUnread ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : unreadMessages && unreadMessages.length > 0 ? (
                      <MessageList 
                        messages={unreadMessages} 
                        selectedMessageId={selectedMessage?.id} 
                        onMessageClick={handleMessageClick} 
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-muted-foreground">אין הודעות חדשות</p>
                      </div>
                    )}
                  </div>
                  <MessageDetails 
                    selectedMessage={selectedMessage}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    handleReplySubmit={handleReplySubmit}
                    isReplying={replyMutation.isPending}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="chat">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[700px]">
                  {/* Left panel - Users and messages list */}
                  <div className="md:col-span-1 border rounded-lg overflow-hidden h-full flex flex-col">
                    <div className="p-3 border-b">
                      <Select
                        value={selectedUserId?.toString() || 'all'}
                        onValueChange={(value) => setSelectedUserId(value === 'all' ? null : parseInt(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="בחר משתמש" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">כל המשתמשים</SelectItem>
                          {!isLoadingUsers && users && users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.username || user.email} {user.firstName && user.lastName ? `(${user.firstName} ${user.lastName})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1 overflow-auto">
                      {isLoadingAllMessages ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : !selectedUserId ? (
                        <div className="flex justify-center items-center h-full">
                          <p className="text-muted-foreground">יש לבחור משתמש לצפייה בהודעות</p>
                        </div>
                      ) : allMessages && allMessages.length > 0 ? (
                        <div className="h-full">
                          <MessageThread 
                            messages={getMessagesForSelectedUser(allMessages)}
                            onMessageClick={handleMessageClick}
                          />
                        </div>
                      ) : (
                        <div className="flex justify-center items-center h-full">
                          <p className="text-muted-foreground">אין הודעות למשתמש זה</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right panel - Chat view */}
                  <div className="md:col-span-2 border rounded-lg overflow-hidden h-full">
                    {selectedMessage ? (
                      <div className="h-full flex flex-col">
                        <div id="admin-chat-container" className="flex-1 overflow-auto p-4 bg-gray-50">
                          <ChatThread 
                            messages={getMessagesForSelectedUser(allMessages)}
                            currentUserId={0} // Admin is always 0 in chat view
                          />
                          <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t bg-white">
                          <form onSubmit={handleReplySubmit} className="flex flex-col gap-2">
                            {/* Image preview if selected */}
                            {selectedImage && (
                              <div className="flex justify-start mb-2">
                                <div className="relative">
                                  <img src={selectedImage} alt="Selected" className="max-w-[200px] max-h-[150px] rounded-lg" />
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                                    onClick={() => setSelectedImage(null)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-end">
                              <div className="relative flex-1">
                                <Textarea
                                  className="flex-1 resize-none pr-20"
                                  placeholder="כתוב הודעה..."
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  dir="rtl"
                                />
                                <div className="absolute right-2 bottom-2 flex gap-2">
                                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                                  <ImageUploader onImageUploaded={handleImageUploaded} />
                                </div>
                              </div>
                              <Button 
                                type="submit" 
                                className="ms-2 self-end"
                                disabled={replyMutation.isPending || (!replyContent.trim() && !selectedImage)}
                              >
                                {replyMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'שלח'
                                )}
                              </Button>
                            </div>
                          </form>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-muted-foreground">בחר הודעה כדי להציג את תוכנה</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="search">
                <div className="mb-4 flex items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="חיפוש לפי שם משתמש, אימייל, נושא או תוכן..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 border rounded-lg overflow-hidden h-[600px]">
                    {isLoadingAllMessages ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : filteredMessages.length > 0 ? (
                      <MessageList 
                        messages={filteredMessages} 
                        selectedMessageId={selectedMessage?.id} 
                        onMessageClick={handleMessageClick} 
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-muted-foreground">לא נמצאו הודעות</p>
                      </div>
                    )}
                  </div>
                  <MessageDetails 
                    selectedMessage={selectedMessage}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    handleReplySubmit={handleReplySubmit}
                    isReplying={replyMutation.isPending}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="orders">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[700px]">
                  {/* Left panel - Orders list */}
                  <div className="md:col-span-1 border rounded-lg overflow-hidden h-full flex flex-col">
                    <div className="p-3 border-b flex justify-between items-center">
                      <h3 className="text-lg font-medium">שיחות לפי הזמנה</h3>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleDirectTestMessage}
                        title="צור הודעת בדיקה להזמנה 10"
                      >
                        צור הודעת בדיקה
                      </Button>
                    </div>
                    
                    <div className="flex-1 overflow-auto">
                      {orderConversations.length === 0 ? (
                        <div className="flex justify-center items-center h-full flex-col gap-4">
                          <p className="text-muted-foreground">אין הודעות להזמנות</p>
                          <div className="text-sm text-muted-foreground">
                            לחץ על "צור הודעת בדיקה" ליצירת הודעה להזמנה #10
                          </div>
                        </div>
                      ) : (
                        <OrderList
                          orders={orderConversations}
                          selectedOrderId={selectedOrderId}
                          onOrderClick={handleOrderClick}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Right panel - Chat view for selected order */}
                  <div className="md:col-span-2 border rounded-lg overflow-hidden h-full">
                    {selectedOrderId ? (
                      <div className="h-full flex flex-col">
                        <div className="p-3 border-b">
                          <h3 className="text-lg font-medium">הזמנה #{selectedOrderId}</h3>
                        </div>
                        <div id="admin-chat-container-orders" className="flex-1 overflow-auto p-4 bg-gray-50">
                          {orderFirebaseMessages.length > 0 ? (
                            <div className="space-y-4 p-2 bg-gray-50">
                              {orderFirebaseMessages
                                .sort((a, b) => {
                                  // Sort messages by date (oldest first)
                                  const dateA = a.createdAt?.toDate?.() 
                                    ? a.createdAt.toDate().getTime() 
                                    : new Date(a.createdAt).getTime();
                                  
                                  const dateB = b.createdAt?.toDate?.() 
                                    ? b.createdAt.toDate().getTime() 
                                    : new Date(b.createdAt).getTime();
                                  
                                  return dateA - dateB; // Ascending order (oldest first)
                                })
                                .map((msg) => {
                                  const isAdmin = msg.isAdmin;
                                  const alignRight = isAdmin;
                                  const alignLeft = !isAdmin;
                                  const senderName = isAdmin ? "מוכר" : "קונה";
                                  
                                  return (
                                    <div 
                                      key={msg.id}
                                      className={`flex ${alignRight ? 'justify-end' : 'justify-start'} mb-3`}
                                    >
                                      <div 
                                        className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                                          alignRight 
                                            ? 'bg-blue-500 text-white rounded-tr-none' 
                                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                        }`}
                                      >
                                        <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                        
                                        {/* Display image if any */}
                                        {msg.imageUrl && (
                                          <div className="mt-2">
                                            <img 
                                              src={msg.imageUrl} 
                                              alt="תמונה שצורפה" 
                                              className="max-w-full rounded-lg max-h-40" 
                                            />
                                          </div>
                                        )}
                                        
                                        <div className={`flex items-center text-xs mt-1 ${alignRight ? 'text-blue-100' : 'text-gray-500'}`}>
                                          <span>{format(new Date(
                                              msg.createdAt?.toDate?.() ? msg.createdAt.toDate() : new Date(msg.createdAt)
                                            ), 'HH:mm', { locale: he })}</span>
                                          <span className="mx-1">•</span>
                                          <span>{senderName}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              <div ref={messagesEndRef} />
                            </div>
                          ) : (
                            <div className="flex justify-center items-center h-full">
                              <p className="text-muted-foreground">אין הודעות להזמנה זו עדיין</p>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t bg-white">
                          <form onSubmit={handleReplySubmit} className="flex flex-col gap-2">
                            {/* Image preview if selected */}
                            {selectedImage && (
                              <div className="flex justify-start mb-2">
                                <div className="relative">
                                  <img src={selectedImage} alt="Selected" className="max-w-[200px] max-h-[150px] rounded-lg" />
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                                    onClick={() => setSelectedImage(null)}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-end">
                              <div className="relative flex-1">
                                <Textarea
                                  className="flex-1 resize-none pr-20"
                                  placeholder="כתוב הודעה..."
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  dir="rtl"
                                />
                                <div className="absolute right-2 bottom-2 flex gap-2">
                                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                                  <ImageUploader onImageUploaded={handleImageUploaded} />
                                </div>
                              </div>
                              <Button 
                                type="submit" 
                                className="ms-2 self-end"
                                disabled={!selectedOrderId || (!replyContent.trim() && !selectedImage)}
                              >
                                {replyMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'שלח'
                                )}
                              </Button>
                            </div>
                          </form>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-muted-foreground">נא לבחור הזמנה מהרשימה</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="orders-old">
                <div className="mb-4">
                  <Select
                    value={selectedOrderId?.toString() || 'all'}
                    onValueChange={(value) => setSelectedOrderId(value === 'all' ? null : isNaN(parseInt(value)) ? value : parseInt(value))}
                  >
                    <SelectTrigger className="w-full md:w-80">
                      <SelectValue placeholder="בחר הזמנה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל ההזמנות</SelectItem>
                      {!isLoadingOrders && orders && orders.map((order: any) => (
                        <SelectItem key={order.id} value={order.id.toString()}>
                          הזמנה #{order.orderNumber} - {order.customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 border rounded-lg overflow-hidden h-[600px]">
                    {isLoadingOrderMessages || (selectedOrderId && !orderMessages) ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !selectedOrderId ? (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-muted-foreground">יש לבחור הזמנה</p>
                      </div>
                    ) : orderMessages && orderMessages.length > 0 ? (
                      <MessageList 
                        messages={orderMessages} 
                        selectedMessageId={selectedMessage?.id} 
                        onMessageClick={handleMessageClick} 
                      />
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-muted-foreground">אין הודעות להזמנה זו</p>
                      </div>
                    )}
                  </div>
                  <MessageDetails 
                    selectedMessage={selectedMessage}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    handleReplySubmit={handleReplySubmit}
                    isReplying={replyMutation.isPending}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// Message list component
interface MessageListProps {
  messages: Message[];
  selectedMessageId?: number;
  onMessageClick: (message: Message) => void;
}

function MessageList({ messages, selectedMessageId, onMessageClick }: MessageListProps) {
  return (
    <div className="divide-y overflow-auto h-full">
      {messages.map((message: Message) => (
        <div
          key={message.id}
          className={`p-3 cursor-pointer hover:bg-muted ${
            selectedMessageId === message.id ? 'bg-muted' : ''
          } ${!message.isRead ? 'font-bold' : ''}`}
          onClick={() => onMessageClick(message)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center">
                <p className="font-medium truncate">{message.subject}</p>
                {!message.isRead && (
                  <Badge variant="destructive" className="ml-2">
                    חדש
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate mt-1">
                {message.content.substring(0, 50)}
                {message.content.length > 50 ? '...' : ''}
              </p>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <span className="font-medium">
                  {message.user?.username || 'משתמש לא ידוע'} 
                  {message.user?.email && ` (${message.user.email})`}
                </span>
                {message.orderId && (
                  <span className="ml-2">
                    | הזמנה #{message.orderId}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
          </p>
        </div>
      ))}
    </div>
  );
}

// OrderList component to show orders in sidebar
interface OrderListProps {
  orders: OrderSummary[];
  selectedOrderId?: number | string | null;
  onOrderClick: (orderId: number) => void;
}

function OrderList({ orders, selectedOrderId, onOrderClick }: OrderListProps) {
  return (
    <div className="divide-y overflow-auto h-full">
      {orders.length === 0 ? (
        <div className="flex justify-center items-center h-full p-4">
          <p className="text-muted-foreground">אין הודעות להזמנות</p>
        </div>
      ) : (
        orders.map((order) => (
          <div 
            key={order.orderId} 
            className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedOrderId === order.orderId ? 'bg-gray-100' : ''}`}
            onClick={() => onOrderClick(order.orderId)}
          >
            <div className="flex justify-between items-center mb-1">
              <div className="font-semibold">
                הזמנה #{order.orderId}
              </div>
              <div className="text-xs text-gray-500">
                {order.date && format(new Date(order.date), 'dd/MM/yyyy', { locale: he })}
              </div>
            </div>
            {order.unreadCount && order.unreadCount > 0 && (
              <div className="mt-1 flex justify-end">
                <Badge variant="secondary">{order.unreadCount} הודעות חדשות</Badge>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// Thread view for WhatsApp style messaging
interface MessageThreadProps {
  messages: Message[];
  onMessageClick: (message: Message) => void;
}

function MessageThread({ messages, onMessageClick }: MessageThreadProps) {
  // Group messages by date (today, yesterday, older)
  const groupedMessages = messages.reduce((groups: Record<string, Message[]>, message) => {
    const date = new Date(message.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let groupKey;
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'היום';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'אתמול';
    } else {
      groupKey = format(date, 'dd/MM/yyyy', { locale: he });
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(message);
    return groups;
  }, {});
  
  // Sort messages by date
  const sortedDates = Object.keys(groupedMessages).sort((a, b) => {
    if (a === 'היום') return -1;
    if (b === 'היום') return 1;
    if (a === 'אתמול') return -1;
    if (b === 'אתמול') return 1;
    
    // Parse and compare dates
    const dateA = a.split('/').reverse().join('-');
    const dateB = b.split('/').reverse().join('-');
    return dateB.localeCompare(dateA);
  });
  
  return (
    <div className="divide-y overflow-auto h-full">
      {sortedDates.map(dateGroup => (
        <div key={dateGroup} className="message-date-group">
          <div className="sticky top-0 bg-gray-100 text-xs text-center py-1">
            {dateGroup}
          </div>
          {groupedMessages[dateGroup]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(message => (
              <div
                key={message.id}
                className={`p-3 cursor-pointer hover:bg-muted ${!message.isRead ? 'font-bold' : ''}`}
                onClick={() => onMessageClick(message)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground truncate">
                          {message.content.substring(0, 50)}
                          {message.content.length > 50 ? '...' : ''}
                        </p>
                      </div>
                      <div className="ml-2 flex flex-col items-end">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'HH:mm', { locale: he })}
                        </p>
                        {!message.isRead && (
                          <Badge variant="destructive" className="mt-1">
                            חדש
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

// WhatsApp style chat thread
interface ChatThreadProps {
  messages: Message[];
  currentUserId: number;
}

function ChatThread({ messages, currentUserId }: ChatThreadProps) {
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      const chatContainer = document.getElementById('admin-chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }, [messages]);
  
  // Combine messages and their replies into a single chronological thread
  const allMessages = messages.flatMap((message) => {
    const threadMessages: ThreadMessage[] = [
      {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        isFromAdmin: message.isFromAdmin || false,
        userId: message.userId,
        imageUrl: message.imageUrl,
        orderId: message.orderId
      }
    ];
    
    if (message.replies) {
      message.replies.forEach((reply) => {
        threadMessages.push({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          isFromAdmin: reply.isFromAdmin || false,
          userId: reply.userId,
          imageUrl: reply.imageUrl,
          orderId: message.orderId
        });
      });
    }
    
    return threadMessages;
  });
  
  // Sort all messages by orderId first (if exists), then by date
  const sortedMessages = allMessages.sort((a, b) => {
    // First sort by orderId in ascending order (if exists)
    if (a.orderId && b.orderId) {
      if (a.orderId !== b.orderId) {
        return a.orderId - b.orderId;
      }
    }
    // Then sort by date for same order or when orderId doesn't exist
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  
  if (sortedMessages.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-muted-foreground">אין הודעות להצגה</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4 p-2 bg-gray-50">
      {sortedMessages.map((msg) => {
        const isCurrentUser = currentUserId === msg.userId;
        const isAdmin = msg.isFromAdmin;
        const isSeller = isAdmin || currentUserId === 0; // Admin is denoted by currentUserId = 0
        const alignRight = isSeller;
        const alignLeft = !isSeller;
        const senderName = isSeller ? "מוכר" : "קונה";
        
        return (
          <div 
            key={msg.id}
            className={`flex ${alignRight ? 'justify-end' : 'justify-start'} mb-3`}
          >
            <div 
              className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                alignRight 
                  ? 'bg-blue-500 text-white rounded-tr-none' 
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              
              {/* Display image if any */}
              {msg.imageUrl && (
                <div className="mt-2">
                  <img 
                    src={msg.imageUrl} 
                    alt="תמונה שצורפה" 
                    className="max-w-full rounded-lg max-h-40" 
                  />
                </div>
              )}
              
              <div className={`flex items-center text-xs mt-1 ${alignRight ? 'text-blue-100' : 'text-gray-500'}`}>
                <span>{format(new Date(msg.createdAt), 'HH:mm', { locale: he })}</span>
                <span className="mx-1">•</span>
                <span>{senderName}</span>
                {alignRight && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                    <path d="M18 6L7 17L2 12" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

// Message details component
interface MessageDetailsProps {
  selectedMessage: Message | null;
  replyContent: string;
  setReplyContent: (content: string) => void;
  handleReplySubmit: (e: React.FormEvent) => void;
  isReplying: boolean;
}

function MessageDetails({
  selectedMessage,
  replyContent,
  setReplyContent,
  handleReplySubmit,
  isReplying
}: MessageDetailsProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [firebaseMessages, setFirebaseMessages] = useState<FirebaseMessage[]>([]);
  // Removed messagesEndRef - using container ID for scrolling
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setReplyContent(replyContent + emoji);
  };
  
  // Load Firebase messages
  useEffect(() => {
    if (!selectedMessage?.orderId) return;
    
    const unsubscribe = getAllMessages((messages) => {
      // Filter for this order
      const orderMessages = messages.filter(msg => 
        msg.orderId === selectedMessage.orderId
      );
      setFirebaseMessages(orderMessages);
      
      // Scroll to bottom when messages change
      setTimeout(() => {
        const chatContainer = document.getElementById('admin-chat-container-orders');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    });
    
    return () => {
      unsubscribe();
    };
  }, [selectedMessage?.orderId]);
  
  // Handle image upload
  const handleImageUploaded = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    toast({
      title: "תמונה הועלתה",
      description: "התמונה הועלתה בהצלחה ותשלח עם ההודעה",
    });
  };
  
  // Auto-scroll to bottom when replies change
  useEffect(() => {
    setTimeout(() => {
      const chatContainer = document.getElementById('admin-chat-container-orders');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }, [selectedMessage?.replies, firebaseMessages]);
  return (
    <div className="md:col-span-2 border rounded-lg overflow-hidden h-[600px]">
      {selectedMessage ? (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">{selectedMessage.subject}</h3>
            <div className="flex flex-col md:flex-row md:items-center text-sm text-muted-foreground mt-1">
              <span>
                מאת: {selectedMessage.user?.username || 'משתמש לא ידוע'} 
                {selectedMessage.user?.email && ` (${selectedMessage.user.email})`}
              </span>
              <span className="md:mx-2 hidden md:block">•</span>
              <span>
                {format(new Date(selectedMessage.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
              </span>
              {selectedMessage.orderId && (
                <>
                  <span className="md:mx-2 hidden md:block">•</span>
                  <span>
                    הזמנה #{selectedMessage.orderId}
                  </span>
                </>
              )}
            </div>
          </div>
          <div id="admin-chat-container-orders" className="flex-1 overflow-auto p-4 bg-gray-50">
            {/* Initial message */}
            <div className="flex justify-start mb-6">
              <div className="rounded-2xl p-3 max-w-[80%] shadow-sm bg-gray-100 text-gray-800 rounded-tl-none">
                <p className="whitespace-pre-wrap text-sm">{selectedMessage.content}</p>
                {/* Show image if it exists */}
                {selectedMessage.imageUrl && (
                  <div className="mt-2">
                    <img src={selectedMessage.imageUrl} alt="תמונה שצורפה" className="max-w-full rounded-lg max-h-40" />
                  </div>
                )}
                <div className="flex items-center text-xs mt-1 text-gray-500">
                  <span>{format(new Date(selectedMessage.createdAt), 'HH:mm', { locale: he })}</span>
                  <span className="mx-1">•</span>
                  <span>קונה</span>
                </div>
              </div>
            </div>
            
            {/* Firebase messages */}
            {firebaseMessages.length > 0 && (
              <div className="space-y-4">
                {firebaseMessages.map((message) => {
                  const isAdmin = message.isAdmin;
                  const senderName = isAdmin ? "מוכר" : "קונה";
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-3`}
                    >
                      <div 
                        className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                          isAdmin 
                            ? 'bg-blue-500 text-white rounded-tr-none' 
                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        
                        {/* Display image if any */}
                        {message.imageUrl && (
                          <div className="mt-2">
                            <img 
                              src={message.imageUrl} 
                              alt="תמונה שצורפה" 
                              className="max-w-full rounded-lg max-h-40" 
                            />
                          </div>
                        )}
                        
                        <div className={`flex items-center text-xs mt-1 ${isAdmin ? 'text-blue-100' : 'text-gray-500'}`}>
                          <span>{message.createdAt ? format(new Date(message.createdAt.toDate()), 'HH:mm', { locale: he }) : ''}</span>
                          <span className="mx-1">•</span>
                          <span>{senderName}</span>
                          {message.isRead && isAdmin && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                              <path d="M18 6L7 17L2 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Legacy replies from database */}
            {selectedMessage.replies && selectedMessage.replies.length > 0 && (
              <div className="space-y-4">
                {selectedMessage.replies.map((reply) => {
                  const isAdmin = reply.isFromAdmin;
                  const senderName = isAdmin ? "מוכר" : "קונה";
                  
                  return (
                    <div
                      key={reply.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-3`}
                    >
                      <div 
                        className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                          isAdmin 
                            ? 'bg-blue-500 text-white rounded-tr-none' 
                            : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{reply.content}</p>
                        <div className={`flex items-center text-xs mt-1 ${isAdmin ? 'text-blue-100' : 'text-gray-500'}`}>
                          <span>{format(new Date(reply.createdAt), 'HH:mm', { locale: he })}</span>
                          <span className="mx-1">•</span>
                          <span>{senderName}</span>
                          {reply.isRead && isAdmin && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                              <path d="M18 6L7 17L2 12" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Selected image preview for the message being composed */}
            {selectedImage && (
              <div className="flex justify-end mb-4">
                <div className="relative">
                  <img src={selectedImage} alt="Selected" className="max-w-[200px] max-h-[150px] rounded-lg" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                    onClick={() => setSelectedImage(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t bg-white">
            <form onSubmit={handleReplySubmit} className="flex items-end gap-2">
              <div className="relative flex-1">
                <Textarea
                  className="flex-1 resize-none rounded-full min-h-[50px] py-3 pr-4 pl-12 bg-gray-100"
                  placeholder="כתוב הודעה..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  dir="rtl"
                />
                <div className="absolute right-1 bottom-1.5 flex gap-2">
                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                  <ImageUploader onImageUploaded={handleImageUploaded} />
                </div>
              </div>
              <Button 
                type="submit" 
                className="rounded-full h-[50px] w-[50px] p-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600"
                disabled={isReplying || (!replyContent.trim() && !selectedImage)}
              >
                {isReplying ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center h-full text-muted-foreground">
          <p>יש לבחור הודעה כדי לצפות בפרטים</p>
        </div>
      )}
    </div>
  );
}