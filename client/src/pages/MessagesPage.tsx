import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { 
  createMessage as createFirebaseMessage, 
  FirebaseMessage, 
  markMessageAsRead, 
  getOrderMessages,
  getUserMessages,
  getUnreadMessagesCount,
  uploadMessageImage as uploadOrderImage,
  getUserOrdersWithMessages,
  OrderWithLatestMessage
} from '@/lib/firebaseMessages';

import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Message } from '@shared/schema';
import { Loader2, CheckCheck, ShoppingBag } from 'lucide-react';
import { useLocation } from 'wouter';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ImageUploader } from '@/components/ui/ImageUploader';

export default function MessagesPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [newMessageForm, setNewMessageForm] = useState({
    subject: '',
    content: '',
    orderId: ''
  });
  const [isNewMessageDialogOpen, setIsNewMessageDialogOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [firebaseMessages, setFirebaseMessages] = useState<FirebaseMessage[]>([]);
  const [userOrdersWithMessages, setUserOrdersWithMessages] = useState<OrderWithLatestMessage[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Query to fetch messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/messages');
      return response.json();
    },
    staleTime: 1000 * 60 // 1 minute
  });

  // Mutation to mark a message as read
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest('PATCH', `/api/messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
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

  // Mutation to create new message
  const createMessageMutation = useMutation({
    mutationFn: async (messageData: typeof newMessageForm) => {
      const response = await apiRequest('POST', '/api/messages', messageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setIsNewMessageDialogOpen(false);
      setNewMessageForm({
        subject: '',
        content: '',
        orderId: ''
      });
      toast({
        title: 'הודעה נשלחה',
        description: 'ההודעה שלך נשלחה בהצלחה'
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשלוח את ההודעה',
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
        isAdmin: user.role === 'admin'
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
            queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
          }
        }
        else if (data.type === 'new_message') {
          // Update the selected message with the new message
          if (selectedMessage && selectedMessage.orderId === data.message.orderId) {
            queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
            
            // Scroll to the bottom of the chat container
            setTimeout(() => {
              const chatContainer = document.getElementById('chat-container');
              if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
              }
            }, 100);
          }
        }
        else if (data.type === 'message_read') {
          // Update the message read status
          queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
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
  
  // Effect to load Firebase messages for the user
  useEffect(() => {
    if (!user) return;
    
    const unsubscribeMessages = getUserMessages(user.id, (messages) => {
      setFirebaseMessages(messages);
    });
    
    const unsubscribeOrders = getUserOrdersWithMessages(user.id, (orders) => {
      setUserOrdersWithMessages(orders);
    });
    
    return () => {
      unsubscribeMessages();
      unsubscribeOrders();
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
      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }, [selectedMessage]);
  
  // Helper function to create placeholder messages
  const createPlaceholderMessage = (orderId: number): Message => ({
    id: 0,
    userId: user?.id || 0,
    orderId: orderId,
    content: `שיחה על הזמנה #${orderId}`,
    subject: `הזמנה #${orderId}`,
    createdAt: new Date(),
    isRead: true,
    isFromAdmin: false,
    imageUrl: null,
    parentId: null,
    replies: []
  });

  // Effect to load order-specific Firebase messages when an order is selected
  const [orderMessages, setOrderMessages] = useState<FirebaseMessage[]>([]);
  
  useEffect(() => {
    if (!selectedMessage || !selectedMessage.orderId) return;
    
    // Unsubscribe from previous subscription
    let unsubscribe = () => {};
    
    // Subscribe to order-specific messages
    unsubscribe = getOrderMessages(selectedMessage.orderId, (messages) => {
      setOrderMessages(messages);
      
      // Scroll to the bottom when messages update
      setTimeout(() => {
        // Scroll for both chat containers
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        const orderChatContainer = document.getElementById('chat-container-orders');
        if (orderChatContainer) {
          orderChatContainer.scrollTop = orderChatContainer.scrollHeight;
        }
      }, 100);
    });
    
    return () => {
      unsubscribe();
    };
  }, [selectedMessage?.orderId]);

  // Handle message click
  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    
    // If the message has an orderId, mark any Firebase messages for this order as read
    if (message.orderId) {
      // Filter for unread Firebase messages from admin for this order
      const unreadMessages = firebaseMessages.filter(msg => 
        msg.orderId === message.orderId && msg.isAdmin && !msg.isRead
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

  // Handle reply submit
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
    
    // Store the content before clearing it to avoid race conditions
    const messageContent = replyContent;
    
    // Clear the input immediately for better user experience
    setReplyContent('');
    
    try {
      // Send message through Firebase
      if (user && selectedMessage.orderId) {
        await createFirebaseMessage({
          content: messageContent,
          orderId: selectedMessage.orderId,
          userId: user.id,
          isAdmin: false,
          isRead: false,
          imageUrl: selectedImage || undefined
        });
        
        setSelectedImage(null);
        
        toast({
          title: 'הודעה נשלחה',
          description: 'ההודעה שלך נשלחה בהצלחה'
        });
        
        // Scroll to the bottom of all chat containers
        setTimeout(() => {
          const chatContainer = document.getElementById('chat-container');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
          
          const orderChatContainer = document.getElementById('chat-container-orders');
          if (orderChatContainer) {
            orderChatContainer.scrollTop = orderChatContainer.scrollHeight;
          }
        }, 100);
      } else {
        // Fallback to REST API if Firebase is not available or no order ID
        replyMutation.mutate({ messageId: selectedMessage.id, content: messageContent });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // If there's an error, restore the content
      setReplyContent(messageContent);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשלוח את ההודעה',
        variant: 'destructive'
      });
    }
  };

  // Handle create message
  const handleCreateMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageForm.subject.trim() || !newMessageForm.content.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין נושא ותוכן להודעה',
        variant: 'destructive'
      });
      return;
    }
    createMessageMutation.mutate(newMessageForm);
  };

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <Helmet>
        <title>הודעות - אור מיה</title>
      </Helmet>
      <div className="container mx-auto py-6 px-4">
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>הודעות שלי</CardTitle>
              <Button onClick={() => setIsNewMessageDialogOpen(true)}>הודעה חדשה</Button>
            </div>
            <CardDescription>
              התכתבות עם צוות אור מיה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="messages" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="messages">הודעות</TabsTrigger>
                <TabsTrigger value="orders">הודעות לפי הזמנה</TabsTrigger>
              </TabsList>
              <TabsContent value="messages">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[700px]">
                  {/* Left panel - Messages list */}
                  <div className="md:col-span-1 border rounded-lg overflow-hidden h-full flex flex-col">
                    <div className="p-3 border-b bg-white">
                      <h3 className="font-semibold">הודעות שלי</h3>
                    </div>
                    
                    <div className="flex-1 overflow-auto">
                      {isLoadingMessages ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : messages && messages.length > 0 ? (
                        <div className="divide-y overflow-auto h-full">
                          {messages.map((message: Message) => (
                            <div
                              key={message.id}
                              className={`p-3 cursor-pointer hover:bg-muted ${
                                selectedMessage?.id === message.id ? 'bg-muted' : ''
                              } ${!message.isRead && !message.isFromAdmin ? 'font-semibold' : ''}`}
                              onClick={() => handleMessageClick(message)}
                            >
                              <div className="flex flex-col">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center">
                                      <p className="font-medium truncate">{message.subject}</p>
                                      {!message.isRead && !message.isFromAdmin && (
                                        <Badge variant="outline" className="text-primary ml-2">
                                          חדש
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(message.createdAt), 'dd/MM HH:mm', { locale: he })}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                  {/* Show preview of the last message */}
                                  {message.replies && message.replies.length > 0 
                                    ? message.replies[message.replies.length - 1].content.substring(0, 40) + (message.replies[message.replies.length - 1].content.length > 40 ? '...' : '')
                                    : message.content.substring(0, 40) + (message.content.length > 40 ? '...' : '')}
                                </p>
                                {message.orderId && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    הזמנה #{message.orderId}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center items-center h-full p-4 text-center">
                          <p className="mb-4 text-muted-foreground">אין הודעות עדיין</p>
                          <Button onClick={() => setIsNewMessageDialogOpen(true)}>
                            שלח הודעה חדשה
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right panel - Chat view */}
                  <div className="md:col-span-2 border rounded-lg overflow-hidden h-full">
                    {selectedMessage ? (
                      <div className="h-full flex flex-col">
                        <div className="p-3 border-b bg-white">
                          <h3 className="font-semibold">
                            {selectedMessage.subject}
                            {selectedMessage.orderId && (
                              <span className="text-sm text-muted-foreground mr-2">
                                (הזמנה #{selectedMessage.orderId})
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            צ'אט עם צוות אור מיה
                          </p>
                        </div>
                        
                        <div id="chat-container" className="flex-1 overflow-auto p-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* Initial message */}
                            <div className="flex justify-end mb-3">
                              <div className="rounded-2xl p-3 max-w-[80%] shadow-sm bg-blue-500 text-white rounded-tr-none">
                                <p className="whitespace-pre-wrap text-sm">{selectedMessage.content}</p>
                                <div className="flex items-center text-xs mt-1 text-blue-100">
                                  <span>{format(new Date(selectedMessage.createdAt), 'HH:mm', { locale: he })}</span>
                                  <span className="mx-1">•</span>
                                  <span>אני</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* All replies in chronological order - WhatsApp style */}
                            {selectedMessage.replies && selectedMessage.replies
                              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                              .map((reply) => {
                                const isAdmin = reply.isFromAdmin;
                                const senderName = isAdmin ? "צוות אור מיה" : "אני";
                                
                                return (
                                  <div
                                    key={reply.id}
                                    className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} mb-3`}
                                  >
                                    <div
                                      className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                                        isAdmin 
                                          ? 'bg-gray-100 text-gray-800 rounded-tl-none' 
                                          : 'bg-blue-500 text-white rounded-tr-none'
                                      }`}
                                    >
                                      <p className="whitespace-pre-wrap text-sm">{reply.content}</p>
                                      <div className={`flex items-center text-xs mt-1 ${isAdmin ? 'text-gray-500' : 'text-blue-100'}`}>
                                        <span>{format(new Date(reply.createdAt), 'HH:mm', { locale: he })}</span>
                                        <span className="mx-1">•</span>
                                        <span>{senderName}</span>
                                        {!isAdmin && reply.isRead && (
                                          <CheckCheck className="ml-1 h-3 w-3" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            
                            {/* Firebase messages for this order */}
                            {selectedMessage.orderId && firebaseMessages
                              .filter(msg => msg.orderId === selectedMessage.orderId)
                              .sort((a, b) => {
                                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                                return dateA.getTime() - dateB.getTime();
                              })
                              .map((message) => {
                                const isAdmin = message.isAdmin;
                                const senderName = isAdmin ? "צוות אור מיה" : "אני";
                                const date = message.createdAt?.toDate ? message.createdAt.toDate() : new Date(message.createdAt);
                                
                                return (
                                  <div
                                    key={message.id}
                                    className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} mb-3`}
                                  >
                                    <div
                                      className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                                        isAdmin 
                                          ? 'bg-gray-100 text-gray-800 rounded-tl-none' 
                                          : 'bg-blue-500 text-white rounded-tr-none'
                                      }`}
                                    >
                                      {message.content && message.content.trim() !== "" && (
                                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                                      )}
                                      
                                      {message.imageUrl && (
                                        <div className="mt-2">
                                          <img 
                                            src={message.imageUrl} 
                                            alt="תמונה שצורפה" 
                                            className="max-w-full rounded-lg max-h-40 object-contain" 
                                          />
                                        </div>
                                      )}
                                      
                                      <div className={`flex items-center text-xs mt-1 ${isAdmin ? 'text-gray-500' : 'text-blue-100'}`}>
                                        <span>{format(date, 'HH:mm', { locale: he })}</span>
                                        <span className="mx-1">•</span>
                                        <span>{senderName}</span>
                                        {!isAdmin && message.isRead && (
                                          <CheckCheck className="ml-1 h-3 w-3" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            <div ref={messagesEndRef} />
                          </div>
                        </div>
                        
                        {/* AliExpress style message input with emoji and image support */}
                        <div className="p-3 border-t bg-white">
                          <form onSubmit={handleReplySubmit} className="flex items-end gap-2">
                            <div className="relative flex-1">
                              <Textarea
                                className="flex-1 resize-none rounded-xl min-h-[50px] py-3 pr-4 pl-24 bg-gray-100"
                                placeholder="כתוב הודעה..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                dir="rtl"
                              />
                              <div className="absolute right-2 bottom-2 flex gap-2 items-center">
                                {/* Emoji picker */}
                                <EmojiPicker 
                                  onEmojiSelect={(emoji) => setReplyContent(replyContent + emoji)} 
                                />
                                
                                {/* Image uploader */}
                                <ImageUploader 
                                  orderId={selectedMessage?.orderId || undefined}
                                  onImageUploaded={async (imageUrl) => {
                                    if (!selectedMessage || !user) return;
                                    
                                    try {
                                      if (!selectedMessage.orderId) {
                                        toast({
                                          title: 'שגיאה',
                                          description: 'לא ניתן להעלות תמונה להודעה ללא מספר הזמנה',
                                          variant: 'destructive'
                                        });
                                        return;
                                      }
                                      
                                      // Send message with the image URL
                                      await createFirebaseMessage({
                                        content: '📷 תמונה',
                                        imageUrl: imageUrl,
                                        userId: user.id,
                                        isAdmin: false,
                                        orderId: selectedMessage.orderId,
                                        isRead: false
                                      });
                                      
                                      toast({
                                        title: 'תמונה נשלחה',
                                        description: 'התמונה שלך נשלחה בהצלחה'
                                      });
                                    } catch (error) {
                                      console.error("Error uploading image:", error);
                                      toast({
                                        title: 'שגיאה',
                                        description: 'לא ניתן להעלות את התמונה',
                                        variant: 'destructive'
                                      });
                                    }
                                  }}
                                  disabled={replyMutation.isPending}
                                />
                              </div>
                            </div>
                            <Button 
                              type="submit" 
                              className="rounded-full h-[50px] w-[50px] p-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600"
                              disabled={replyMutation.isPending || !replyContent.trim()}
                            >
                              {replyMutation.isPending ? (
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
                      <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                        <p className="mb-4">יש לבחור הודעה כדי לצפות בשיחה</p>
                        <Button variant="outline" onClick={() => setIsNewMessageDialogOpen(true)}>
                          הודעה חדשה
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="orders">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[700px]">
                  {/* Left panel - Orders list */}
                  <div className="md:col-span-1 border rounded-lg overflow-hidden h-full flex flex-col">
                    <div className="p-3 border-b bg-white">
                      <h3 className="font-semibold">הזמנות עם הודעות</h3>
                    </div>
                    
                    <div className="flex-1 overflow-auto">
                      {userOrdersWithMessages.length > 0 ? (
                        <div className="divide-y overflow-auto h-full">
                          {userOrdersWithMessages.map((order) => (
                            <div
                              key={order.orderId}
                              className={`p-3 cursor-pointer hover:bg-muted ${
                                selectedOrderId === order.orderId ? 'bg-muted' : ''
                              } ${order.unreadCount > 0 ? 'font-semibold' : ''}`}
                              onClick={() => {
                                setSelectedOrderId(order.orderId);
                                // Find a message with this orderId, or create a placeholder
                                const existingMessage = messages?.find(
                                  (m: Message) => m.orderId === order.orderId
                                );
                                
                                if (existingMessage) {
                                  handleMessageClick(existingMessage);
                                } else {
                                  // Create a placeholder message object to initiate chat for this order
                                  setSelectedMessage(createPlaceholderMessage(order.orderId));
                                }
                                
                                // Mark unread messages as read
                                if (order.unreadCount > 0) {
                                  const unreadMessages = firebaseMessages.filter(msg => 
                                    msg.orderId === order.orderId && msg.isAdmin && !msg.isRead
                                  );
                                  
                                  if (unreadMessages.length > 0) {
                                    const messageIds = unreadMessages
                                      .filter(msg => msg.id)
                                      .map(msg => msg.id as string);
                                    
                                    if (messageIds.length > 0) {
                                      markMessageAsRead(messageIds, order.orderId)
                                        .catch(error => console.error("Error marking messages as read:", error));
                                    }
                                  }
                                }
                              }}
                            >
                              <div className="flex flex-col">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center">
                                      <p className="font-medium truncate">הזמנה #{order.orderId}</p>
                                      {order.unreadCount > 0 && (
                                        <Badge variant="outline" className="text-primary ml-2">
                                          {order.unreadCount}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {order.latestMessage.createdAt?.toDate ? 
                                      format(new Date(order.latestMessage.createdAt.toDate()), 'dd/MM/yyyy', { locale: he }) :
                                      format(new Date(order.latestMessage.createdAt), 'dd/MM/yyyy', { locale: he })}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                  {order.latestMessage.content.substring(0, 40) + 
                                    (order.latestMessage.content.length > 40 ? '...' : '')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center items-center h-full p-4 text-center">
                          <p className="mb-4 text-muted-foreground">אין הודעות עדיין</p>
                          <Button onClick={() => navigate('/orders')}>
                            עבור לדף ההזמנות שלי
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right panel - Chat view */}
                  <div className="md:col-span-2 border rounded-lg overflow-hidden h-full">
                    {selectedMessage ? (
                      <div className="h-full flex flex-col">
                        <div className="p-3 border-b bg-white">
                          <h3 className="font-semibold">
                            {selectedMessage.subject}
                            {selectedMessage.orderId && (
                              <span className="text-sm text-muted-foreground mr-2">
                                (הזמנה #{selectedMessage.orderId})
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            צ'אט עם צוות אור מיה
                          </p>
                        </div>
                        
                        <div id="chat-container-orders" className="flex-1 overflow-auto p-4 bg-gray-50">
                          <div className="space-y-4">
                            {/* We don't show the initial message here since we're focusing on order-specific messages */}
                            
                            {/* Firebase messages for this order */}
                            {orderMessages.length > 0 && (
                              <div className="space-y-4">
                                {orderMessages.map((message) => {
                                  const isFromUser = !message.isAdmin;
                                  const senderName = isFromUser ? "אני" : "אור מיה";
                                  
                                  return (
                                    <div
                                      key={message.id}
                                      className={`flex ${isFromUser ? 'justify-end' : 'justify-start'} mb-3`}
                                    >
                                      <div 
                                        className={`rounded-2xl p-3 max-w-[80%] shadow-sm ${
                                          isFromUser 
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
                                        
                                        <div className={`flex items-center text-xs mt-1 ${isFromUser ? 'text-blue-100' : 'text-gray-500'}`}>
                                          <span>
                                            {message.createdAt?.toDate ? 
                                              format(new Date(message.createdAt.toDate()), 'HH:mm', { locale: he }) : 
                                              format(new Date(message.createdAt), 'HH:mm', { locale: he })}
                                          </span>
                                          <span className="mx-1">•</span>
                                          <span>{senderName}</span>
                                          {message.isRead && !isFromUser && (
                                            <CheckCheck className="h-3 w-3 ml-1" />
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
                                <EmojiPicker onEmojiSelect={(emoji) => setReplyContent(replyContent + emoji)} />
                                <ImageUploader onImageUploaded={(url) => {
                                  setSelectedImage(url);
                                  toast({
                                    title: "תמונה הועלתה",
                                    description: "התמונה הועלתה בהצלחה ותשלח עם ההודעה",
                                  });
                                }} />
                              </div>
                            </div>
                            <Button 
                              type="submit" 
                              className="rounded-full h-[50px] w-[50px] p-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600"
                              disabled={!replyContent.trim() && !selectedImage}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                              </svg>
                            </Button>
                          </form>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-full text-muted-foreground">
                        <p>יש לבחור הזמנה כדי לצפות בהודעות</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* New Message Dialog */}
      <Dialog open={isNewMessageDialogOpen} onOpenChange={setIsNewMessageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>הודעה חדשה</DialogTitle>
            <DialogDescription>שליחת הודעה חדשה לצוות אור מיה</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateMessage}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  נושא
                </label>
                <Input
                  id="subject"
                  value={newMessageForm.subject}
                  onChange={(e) => setNewMessageForm({ ...newMessageForm, subject: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium">
                  תוכן
                </label>
                <Textarea
                  id="content"
                  value={newMessageForm.content}
                  onChange={(e) => setNewMessageForm({ ...newMessageForm, content: e.target.value })}
                  rows={5}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="orderId" className="text-sm font-medium">
                  מספר הזמנה (אופציונלי)
                </label>
                <Input
                  id="orderId"
                  value={newMessageForm.orderId}
                  onChange={(e) => setNewMessageForm({ ...newMessageForm, orderId: e.target.value })}
                  placeholder="יש להזין מספר הזמנה אם רלוונטי"
                  dir="rtl"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createMessageMutation.isPending || !newMessageForm.subject || !newMessageForm.content}
              >
                {createMessageMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    שולח...
                  </>
                ) : (
                  'שלח הודעה'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}