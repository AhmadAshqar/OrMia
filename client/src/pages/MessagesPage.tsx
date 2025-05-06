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
  const [orderReplyContent, setOrderReplyContent] = useState('');

  const [isConnected, setIsConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [firebaseMessages, setFirebaseMessages] = useState<FirebaseMessage[]>([]);
  const [userOrdersWithMessages, setUserOrdersWithMessages] = useState<OrderWithLatestMessage[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isFirebaseMessagePending, setIsFirebaseMessagePending] = useState(false);
  const [orderMessages, setOrderMessages] = useState<FirebaseMessage[]>([]);
  const websocketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ordersMessagesEndRef = useRef<HTMLDivElement>(null);
  
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



  // Helper function to create a placeholder message object
  const createPlaceholderMessage = (orderId: number): Message => ({
    id: -1, // Temporary ID
    userId: user?.id || 0,
    orderId: orderId,
    subject: `הזמנה #${orderId}`,
    content: "",
    isRead: true,
    isFromAdmin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    replies: []
  });

  // Handle clicking on a message
  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    
    // Mark as read if it's not already read and it's from admin
    if (!message.isRead && message.isFromAdmin) {
      markAsReadMutation.mutate(message.id);
    }
  };

  // Handle submitting a reply
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMessage || !replyContent.trim()) return;
    
    // For Firebase messages (linked to an order)
    if (selectedMessage.orderId) {
      try {
        setIsFirebaseMessagePending(true);
        
        await createFirebaseMessage({
          content: replyContent,
          userId: user?.id || 0,
          isAdmin: false,
          orderId: selectedMessage.orderId,
          isRead: false
        });
        
        setReplyContent('');
        toast({
          title: 'הודעה נשלחה',
          description: 'ההודעה שלך נשלחה בהצלחה'
        });
      } catch (error) {
        console.error("Error sending Firebase message:", error);
        toast({
          title: 'שגיאה',
          description: 'לא ניתן לשלוח את ההודעה',
          variant: 'destructive'
        });
      } finally {
        setIsFirebaseMessagePending(false);
      }
    } else {
      // For regular messages (not linked to an order)
      replyMutation.mutate({
        messageId: selectedMessage.id,
        content: replyContent
      });
    }
  };
  
  // Handle submitting a reply for an order
  const handleOrderReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMessage || !orderReplyContent.trim() || !selectedMessage.orderId) return;
    
    try {
      setIsFirebaseMessagePending(true);
      
      await createFirebaseMessage({
        content: orderReplyContent,
        userId: user?.id || 0,
        isAdmin: false,
        orderId: selectedMessage.orderId,
        isRead: false
      });
      
      setOrderReplyContent('');
      toast({
        title: 'הודעה נשלחה',
        description: 'ההודעה שלך נשלחה בהצלחה'
      });
    } catch (error) {
      console.error("Error sending Firebase message:", error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשלוח את ההודעה',
        variant: 'destructive'
      });
    } finally {
      setIsFirebaseMessagePending(false);
    }
  };



  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (!user) return;
    
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        // Authenticate with user ID
        ws.send(JSON.stringify({
          type: 'auth',
          userId: user.id,
          isAdmin: user.role === 'admin'
        }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'welcome') {
          console.log(data.message);
        } else if (data.type === 'auth_response' && data.success) {
          console.log('WebSocket authentication successful');
          setIsConnected(true);
          
          // Subscribe to messages for current order if one is selected
          if (selectedOrderId) {
            console.log('Subscribing to messages for order', selectedOrderId);
            ws.send(JSON.stringify({
              type: 'subscribe',
              orderId: selectedOrderId
            }));
          }
        } else if (data.type === 'message' && data.orderId) {
          // Refresh messages when we receive a new one
          refreshOrderMessages(data.orderId);
        }
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
        setIsConnected(false);
        // Attempt to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      websocketRef.current = ws;
      
      return () => {
        ws.close();
      };
    };
    
    connectWebSocket();
    
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [user]);

  // Subscribe to messages for an order when selectedOrderId changes
  useEffect(() => {
    if (isConnected && websocketRef.current && selectedOrderId) {
      console.log('Subscribing to messages for order', selectedOrderId);
      websocketRef.current.send(JSON.stringify({
        type: 'subscribe',
        orderId: selectedOrderId
      }));
    }
  }, [selectedOrderId, isConnected]);

  // Fetch Firebase messages
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = getUserMessages(user.id, (messages) => {
      console.log(`Received ${messages.length} Firebase messages in snapshot`);
      setFirebaseMessages(messages);
    });
    
    return () => unsubscribe();
  }, [user]);

  // Fetch user orders with messages
  useEffect(() => {
    if (!user || !firebaseMessages.length) {
      setUserOrdersWithMessages([]);
      return;
    }
    
    const orders = getUserOrdersWithMessages(user.id, firebaseMessages);
    console.log(`Returning ${orders.length} orders with messages for user ${user.id}`);
    setUserOrdersWithMessages(orders);
  }, [user, firebaseMessages]);

  // Fetch messages for the selected order
  useEffect(() => {
    if (!selectedOrderId) {
      setOrderMessages([]);
      return;
    }
    
    const unsubscribe = getOrderMessages(selectedOrderId, (messages) => {
      console.log(`Received ${messages.length} messages for order ${selectedOrderId}`);
      setOrderMessages(messages);
    });
    
    return () => unsubscribe();
  }, [selectedOrderId]);

  // Function to manually refresh messages for an order
  const refreshOrderMessages = (orderId: number) => {
    if (orderId === selectedOrderId) {
      // This will trigger the useEffect hook above
      setSelectedOrderId(null);
      setTimeout(() => setSelectedOrderId(orderId), 10);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedMessage, firebaseMessages]);

  // Auto-scroll to bottom for order messages
  useEffect(() => {
    if (ordersMessagesEndRef.current) {
      ordersMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [orderMessages]);

  // Update document title
  useEffect(() => {
    document.title = "הודעות שלי | אור מיה";
  }, []);

  if (!user) {
    return (
      <MainLayout>
        <div className="container max-w-5xl py-8 mt-12">
          <Card>
            <CardHeader>
              <CardTitle>הודעות שלי</CardTitle>
              <CardDescription>
                עליך להתחבר כדי לצפות בהודעות שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/auth')}>התחבר</Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Helmet>
        <title>הודעות שלי | אור מיה</title>
      </Helmet>
      
      <div className="container max-w-5xl py-8 mt-12">
        <Card>
          <CardHeader>
            <CardTitle>הודעות שלי</CardTitle>
            <CardDescription>
              התכתבות עם צוות אור מיה
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[700px]">
                {/* Left panel - Messages list */}
                <div className="md:col-span-1 border rounded-lg overflow-hidden h-full flex flex-col">
                  <div className="p-3 border-b bg-white flex justify-between items-center">
                    <h3 className="font-semibold">הודעות לפי הזמנה</h3>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        if (!user) return;
                        
                        // Create a test message for order 10
                        createFirebaseMessage({
                          content: "זוהי הודעת בדיקה מהמשתמש " + user.username + " ב-" + new Date().toLocaleString(),
                          orderId: 10,
                          userId: user.id,
                          isAdmin: false,
                          isRead: false
                        }).then(() => {
                          toast({
                            title: 'הודעה נוצרה',
                            description: 'הודעת בדיקה נוצרה להזמנה #10'
                          });
                        }).catch(error => {
                          console.error("Error creating test message:", error);
                          toast({
                            title: 'שגיאה',
                            description: 'לא ניתן ליצור הודעת בדיקה',
                            variant: 'destructive'
                          });
                        });
                      }}
                      title="צור הודעת בדיקה להזמנה 10"
                    >
                      צור הודעת בדיקה
                    </Button>
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
                        <div className="text-xs text-muted-foreground mt-4 border-t pt-4">
                          <p className="font-bold mb-1">מידע לצורך הבנת הבעיה:</p>
                          <p>מזהה משתמש: {user?.id}</p>
                          <p>מספר הודעות Firebase: {firebaseMessages.length}</p>
                          <p>מספר הזמנות עם הודעות: {userOrdersWithMessages.length}</p>
                          <pre className="text-left text-xs mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40 max-w-xs">
                            {JSON.stringify(firebaseMessages, null, 2)}
                          </pre>
                        </div>
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
                          {/* Firebase messages for this order */}
                          {orderMessages.length > 0 ? (
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
                          ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                              <p className="text-muted-foreground mb-2">אין הודעות להזמנה זו עדיין</p>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2"
                                onClick={() => {
                                  if (!user || !selectedMessage?.orderId) return;
                                  
                                  createFirebaseMessage({
                                    content: "זוהי הודעת בדיקה מהמשתמש " + user.username + " ב-" + new Date().toLocaleString(),
                                    orderId: selectedMessage.orderId,
                                    userId: user.id,
                                    isAdmin: false,
                                    isRead: false
                                  }).then(() => {
                                    toast({
                                      title: 'הודעה נוצרה',
                                      description: 'הודעת בדיקה נוצרה להזמנה #' + selectedMessage.orderId
                                    });
                                  }).catch(error => {
                                    console.error("Error creating test message:", error);
                                    toast({
                                      title: 'שגיאה',
                                      description: 'לא ניתן ליצור הודעת בדיקה',
                                      variant: 'destructive'
                                    });
                                  });
                                }}
                              >
                                צור הודעת בדיקה
                              </Button>
                            </div>
                          )}
                          <div ref={ordersMessagesEndRef} />
                        </div>
                      </div>
                      
                      {/* Message input for order-specific messages */}
                      <div className="p-3 border-t bg-white">
                        <form onSubmit={handleOrderReplySubmit} className="flex items-end gap-2">
                          <div className="relative flex-1">
                            <Textarea
                              className="flex-1 resize-none rounded-xl min-h-[50px] py-3 pr-4 pl-24 bg-gray-100"
                              placeholder="כתוב הודעה..."
                              value={orderReplyContent}
                              onChange={(e) => setOrderReplyContent(e.target.value)}
                              dir="rtl"
                            />
                            <div className="absolute right-2 bottom-2 flex gap-2 items-center">
                              {/* Emoji picker */}
                              <EmojiPicker 
                                onEmojiSelect={(emoji) => setOrderReplyContent(orderReplyContent + emoji)} 
                              />
                              
                              {/* Image uploader */}
                              <ImageUploader 
                                orderId={selectedMessage?.orderId || undefined}
                                onImageUploaded={async (imageUrl) => {
                                  if (!selectedMessage || !user) return;
                                  
                                  try {
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
                                disabled={isFirebaseMessagePending}
                              />
                            </div>
                          </div>
                          <Button 
                            type="submit" 
                            className="rounded-full h-[50px] w-[50px] p-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600"
                            disabled={isFirebaseMessagePending || !orderReplyContent.trim()}
                          >
                            {isFirebaseMessagePending ? (
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
                      <p className="mb-4">יש לבחור הזמנה כדי לצפות בשיחה</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      

    </MainLayout>
  );
}