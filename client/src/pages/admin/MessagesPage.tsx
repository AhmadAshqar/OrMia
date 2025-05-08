import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

// Import types from the shared schema
import { OrderSummary, Message } from '@shared/schema';

import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { ImageUploader } from '@/components/ui/ImageUploader';

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [replyContent, setReplyContent] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [orderConversations, setOrderConversations] = useState<OrderSummary[]>([]);
  const [isMessageSending, setIsMessageSending] = useState(false);
  const websocketRef = useRef<WebSocket | null>(null);

  // Fetch orders with messages from the admin endpoint
  const {
    data: ordersWithMessages,
    isLoading: isLoadingOrders,
    refetch: refetchOrdersWithMessages
  } = useQuery({
    queryKey: ['/api/admin/orders-with-messages'],
    queryFn: async () => {
      const response = await fetch('/api/admin/orders-with-messages');
      if (!response.ok) {
        throw new Error('Error fetching orders with messages');
      }
      return response.json();
    }
  });

  // Update orderConversations state when the API returns data
  useEffect(() => {
    if (ordersWithMessages) {
      setOrderConversations(ordersWithMessages);
    }
  }, [ordersWithMessages]);

  // Fetch messages for a specific order via API (using admin-specific endpoint)
  const { 
    data: orderApiMessages,
    isLoading: isLoadingOrderApiMessages,
    refetch: refetchOrderApiMessages
  } = useQuery({
    queryKey: ['/api/admin/orders', selectedOrderId, 'messages'],
    queryFn: async () => {
      if (!selectedOrderId) return [];
      
      const response = await fetch(`/api/admin/orders/${selectedOrderId}/messages`);
      if (!response.ok) {
        throw new Error(`Error fetching messages for order ${selectedOrderId}`);
      }
      return response.json();
    },
    enabled: !!selectedOrderId
  });

  // Handle clicking on an order to view its messages
  const handleOrderClick = async (orderId: number) => {
    setSelectedOrderId(orderId);
    
    try {
      // Fetch messages for the order
      const response = await fetch(`/api/admin/orders/${orderId}/messages`);
      if (!response.ok) throw new Error(`Failed to fetch messages for order ${orderId}`);
      
      const messages = await response.json();
      console.log(`Fetched ${messages.length} messages for order ${orderId} from API`);
      
      // Mark messages as read when viewing them
      await fetch(`/api/admin/orders/${orderId}/messages/mark-read`, { 
        method: 'POST' 
      });
      
      // Update orders list to reflect read status changes
      // Find the order in the conversations list and update its unreadCount
      const updatedConversations = orderConversations.map(order => {
        if (order.orderId === orderId) {
          return { ...order, unreadCount: 0 };
        }
        return order;
      });
      
      setOrderConversations(updatedConversations);
      
    } catch (error) {
      console.error(`Error fetching messages for order ${orderId}:`, error);
    }
  };



  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setReplyContent(replyContent + emoji);
  };

  // Handle image upload
  const handleImageUploaded = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // Handle sending a reply to a message
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrderId || (!replyContent.trim() && !selectedImage)) return;
    
    try {
      setIsMessageSending(true);
      
      // Store message content before clearing
      const messageContent = replyContent.trim();
      const imageUrlToSend = selectedImage || undefined;
      
      // Clear the input immediately for better UX
      setReplyContent('');
      setSelectedImage(null);
      
      // Send the message using the API endpoint
      const response = await fetch(`/api/admin/orders/${selectedOrderId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          imageUrl: imageUrlToSend,
          isFromAdmin: true,
          isRead: false
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message via API');
      }
      
      // Get the created message
      const createdMessage = await response.json();
      console.log('Message sent successfully:', createdMessage);
      
      // Immediately update the order's latest message in the sidebar if needed
      if (orderConversations && orderConversations.length > 0) {
        setOrderConversations((prevList: OrderSummary[]) => {
          return prevList.map((order: OrderSummary) => {
            if (order.orderId === selectedOrderId) {
              // Create a new order with updated information
              return {
                ...order,
                // If there are custom properties you want to update, do it here
                // For now we'll just return the same order
                // This will be refreshed anyway when the API is called
              };
            }
            return order;
          });
        });
      }
      
      // Success toast
      toast({
        title: 'הודעה נשלחה',
        description: 'ההודעה שלך נשלחה בהצלחה'
      });
      
      // Refresh the messages
      refetchOrderApiMessages();
      refetchOrdersWithMessages();
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשלוח את ההודעה',
        variant: 'destructive'
      });
    } finally {
      setIsMessageSending(false);
    }
  };

  // Fetch order conversations using API endpoint instead of Firestore
  const fetchOrderConversations = useCallback(async () => {
    try {
      console.log("Manually fetching order conversations from API");
      
      // Use the refetch method from the useQuery hook
      await refetchOrdersWithMessages();
      
    } catch (error) {
      console.error("Error fetching order conversations:", error);
      setOrderConversations([]);
    }
  }, [refetchOrdersWithMessages]);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      // Check if we already have an open connection
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        return;
      }
      
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const ws = new WebSocket(wsUrl);
        websocketRef.current = ws;
        
        ws.onopen = () => {
          console.log('WebSocket connection established');
          
          // Send authentication
          if (user) {
            ws.send(JSON.stringify({ 
              type: 'auth', 
              userId: user.id,
              isAdmin: true,
              isFromAdmin: true
            }));
          }
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'welcome') {
            console.log(data.message);
          } else if (data.type === 'auth_response' && data.success) {
            console.log('WebSocket authentication successful');
          } else if (data.type === 'new_message') {
            // Refresh data when a new message arrives
            fetchOrderConversations();
            
            if (selectedOrderId && data.orderId === selectedOrderId) {
              refetchOrderApiMessages();
            }
            
            // Show notification
            toast({
              title: 'הודעה חדשה',
              description: `התקבלה הודעה חדשה${data.orderId ? ' להזמנה מספר ' + data.orderId : ''}`
            });
          }
        };
        
        ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event);
          websocketRef.current = null;
          
          // Only attempt to reconnect if this wasn't an intentional close
          if (event.code !== 1000) {
            // Attempt to reconnect after a delay
            setTimeout(connectWebSocket, 3000);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Don't close here as it can lead to InvalidStateError
          // The onclose handler will fire automatically
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (websocketRef.current) {
        try {
          // Only close if connection is still open
          if (websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.close(1000); // 1000 = normal closure
          }
          websocketRef.current = null;
        } catch (error) {
          console.error('Error closing WebSocket:', error);
        }
      }
    };
  }, [user, toast, fetchOrderConversations, selectedOrderId, refetchOrderApiMessages]);

  // Initial fetch of order conversations
  useEffect(() => {
    fetchOrderConversations();
    
    // Refresh every 10 seconds
    const intervalId = setInterval(fetchOrderConversations, 10000);
    
    return () => clearInterval(intervalId);
  }, [fetchOrderConversations]);

  // Auto-scroll to bottom for order messages
  useEffect(() => {
    const orderChatContainer = document.getElementById('admin-chat-container-orders');
    if (orderChatContainer) {
      orderChatContainer.scrollTop = orderChatContainer.scrollHeight;
    }
  }, [orderApiMessages]);

  if (!user) {
    return (
      <AdminLayout>
        <div className="container py-6">
          <div className="flex justify-center items-center h-[60vh]">
            <p className="text-muted-foreground">יש להתחבר כדי לצפות בהודעות</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Helmet>
        <title>ניהול הודעות | OrMia Jewelry</title>
      </Helmet>
      
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>ניהול הודעות</CardTitle>
            <CardDescription>צפייה וניהול הודעות מלקוחות</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="orders" className="space-y-4">
              <TabsContent value="orders">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[700px]">
                  {/* Left panel - Orders list */}
                  <div className="md:col-span-1 border rounded-lg overflow-hidden h-full flex flex-col">
                    <div className="p-3 border-b bg-white">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">שיחות לפי הזמנה</h3>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto">
                      {!orderConversations || orderConversations.length === 0 ? (
                        <div className="flex flex-col justify-center items-center h-full p-4 text-center">
                          <p className="mb-4 text-muted-foreground">אין הודעות להזמנות</p>
                        </div>
                      ) : (
                        <div className="divide-y overflow-auto h-full">
                          {orderConversations.map((order) => (
                            <div
                              key={order.orderId}
                              className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedOrderId === order.orderId ? 'bg-gray-100' : ''}`}
                              onClick={() => handleOrderClick(order.orderId)}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <div className="font-semibold">
                                  הזמנה מספר {order.orderNumber || order.orderId}
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
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right panel - Chat view for selected order */}
                  <div className="md:col-span-2 border rounded-lg overflow-hidden h-full">
                    {selectedOrderId ? (
                      <div className="h-full flex flex-col">
                        <div className="p-3 border-b bg-white">
                          <h3 className="font-semibold">
                            הזמנה מספר {
                              orderConversations.find(order => order.orderId === selectedOrderId)?.orderNumber || selectedOrderId
                            }
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            צ'אט עם לקוח
                          </p>
                        </div>
                        <div id="admin-chat-container-orders" className="flex-1 overflow-auto p-4 bg-gray-50">
                          {orderApiMessages && orderApiMessages.length > 0 ? (
                            <div className="space-y-4">
                              {orderApiMessages
                                .sort((a: Message, b: Message) => {
                                  // Sort messages by date (oldest first)
                                  const dateA = new Date(a.createdAt).getTime();
                                  const dateB = new Date(b.createdAt).getTime();
                                  
                                  return dateA - dateB; // Ascending order (oldest first)
                                })
                                .map((msg: Message) => {
                                  const isAdmin = msg.isFromAdmin;
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
                                          <span>{format(new Date(msg.createdAt), 'HH:mm', { locale: he })}</span>
                                          <span className="mx-1">•</span>
                                          <span>{senderName}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                              <p className="text-muted-foreground mb-2">אין הודעות להזמנה זו עדיין</p>
                            </div>
                          )}
                        </div>
                        <div className="p-3 border-t bg-white">
                          <form onSubmit={handleReplySubmit} className="flex items-end gap-2">
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
                            
                            <div className="relative flex-1">
                              <Textarea
                                className="flex-1 resize-none rounded-xl min-h-[50px] py-3 pr-4 pl-24 bg-gray-100"
                                placeholder="כתוב הודעה..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                dir="rtl"
                              />
                              <div className="absolute right-2 bottom-2 flex gap-2 items-center">
                                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                                <ImageUploader onImageUploaded={handleImageUploaded} />
                              </div>
                            </div>
                            <Button 
                              type="submit" 
                              className="rounded-full h-[50px] w-[50px] p-0 flex items-center justify-center bg-blue-500 hover:bg-blue-600"
                              disabled={isMessageSending || (!replyContent.trim() && !selectedImage)}
                            >
                              {isMessageSending ? (
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
                      <div className="flex justify-center items-center h-full">
                        <p className="text-muted-foreground">נא לבחור הזמנה מהרשימה</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}