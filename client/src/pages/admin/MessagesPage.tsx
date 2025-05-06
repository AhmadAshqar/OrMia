import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { 
  createMessage as createFirebaseMessage, 
  FirebaseMessage, 
  getAllMessages, 
  markMessageAsRead, 
  getOrderMessages,
  getAllOrdersWithMessages,
  uploadMessageImage as uploadOrderImage
} from '@/lib/firebaseMessages';

import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Message } from '@shared/schema';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ImageUploader } from '@/components/ui/ImageUploader';

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
  const websocketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
            if (messagesEndRef.current) {
              setTimeout(() => {
            const chatContainer = document.getElementById('admin-chat-container');
            if (chatContainer) {
              chatContainer.scrollTop = chatContainer.scrollHeight;
            }
          }, 100);
            }
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
    if (!selectedMessage) return;
    if (!replyContent.trim() && !selectedImage) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין תוכן להודעה או לבחור תמונה',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Send message through Firebase
      if (user) {
        // Ensure orderId is defined before creating message
        if (!selectedMessage.orderId) {
          throw new Error('Order ID is required for Firebase messages');
        }
        
        await createFirebaseMessage({
          content: replyContent,
          orderId: selectedMessage.orderId,
          userId: user.id,
          isAdmin: true,
          isRead: false,
          imageUrl: selectedImage || undefined
        });
        
        // Mark related messages as read
        if (selectedMessage.id && selectedMessage.orderId) {
          await markMessageAsRead(selectedMessage.id.toString(), selectedMessage.orderId);
        }
        
        // Also mark any unread Firebase messages for this order as read
        if (selectedMessage.orderId) {
          const unreadUserMessages = firebaseMessages.filter(msg => 
            msg.orderId === selectedMessage.orderId && !msg.isAdmin && !msg.isRead
          );
          
          // Use batch update to mark all unread messages as read at once
          if (unreadUserMessages.length > 0) {
            const messageIds = unreadUserMessages
              .filter(msg => msg.id)
              .map(msg => msg.id as string);
            
            if (messageIds.length > 0) {
              await markMessageAsRead(messageIds, selectedMessage.orderId);
            }
          }
        }
        
        setReplyContent('');
        setSelectedImage(null);
        
        toast({
          title: 'הודעה נשלחה',
          description: 'התשובה שלך נשלחה בהצלחה'
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשלוח את התשובה',
        variant: 'destructive'
      });
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setReplyContent(prev: string => prev + emoji);
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
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="chat">
                  צ'אטים
                </TabsTrigger>
                <TabsTrigger value="unread">
                  הודעות חדשות
                  {unreadMessages && unreadMessages.length > 0 && (
                    <Badge variant="destructive" className="ml-2">{unreadMessages.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="search">חיפוש הודעות</TabsTrigger>
                <TabsTrigger value="orders">הודעות לפי הזמנה</TabsTrigger>
              </TabsList>
              
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
    const threadMessages = [
      {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        isFromAdmin: message.isFromAdmin || false,
        userId: message.userId,
        imageUrl: message.imageUrl
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
          imageUrl: reply.imageUrl
        });
      });
    }
    
    return threadMessages;
  });
  
  // Sort all messages by date
  const sortedMessages = allMessages.sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setReplyContent((prev: string) => prev + emoji);
  };
  
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