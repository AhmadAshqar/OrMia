import { useState, useEffect, useRef, useCallback } from 'react';
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
  uploadMessageImage,
  getUserOrdersWithMessages,
  OrderWithLatestMessage
} from '@/lib/firebaseMessages';

import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
// import { Input } from '@/components/ui/input';
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
  // Removed new message form state and dialog state
  const [isConnected, setIsConnected] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [firebaseMessages, setFirebaseMessages] = useState<FirebaseMessage[]>([]);
  const [userOrdersWithMessages, setUserOrdersWithMessages] = useState<OrderWithLatestMessage[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isFirebaseMessagePending, setIsFirebaseMessagePending] = useState(false);
  const [orderMessages, setOrderMessages] = useState<FirebaseMessage[]>([]);
  const websocketRef = useRef<WebSocket | null>(null);
  // Removed unnecessary ref usage - using container ID-based scrolling instead
  
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

  // Removed create message mutation

  // Helper function to create a placeholder message object
  const createPlaceholderMessage = (orderId: number): Message => {
    // Find order number from our list of orders with messages
    const orderInfo = userOrdersWithMessages.find(order => order.orderId === orderId);
    const orderNumber = orderInfo?.orderNumber || orderId.toString();
    
    return {
      id: -1, // Temporary ID
      userId: user?.id || 0,
      orderId: orderId,
      subject: `הזמנה #${orderNumber}`,
      content: "",
      isRead: true,
      isFromAdmin: false,
      createdAt: new Date(),
      imageUrl: null,
      parentId: null
    };
  };

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
          isFromAdmin: false,
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
      
      // Find order number from our list of orders with messages
      const orderInfo = userOrdersWithMessages.find(order => order.orderId === selectedMessage.orderId);
      const orderNumber = orderInfo?.orderNumber || selectedMessage.orderId.toString();
      
      // Store the content before clearing it to update UI immediately
      const messageContent = orderReplyContent.trim();
      
      // Clear input immediately for better UX
      setOrderReplyContent('');
      
      // Use API endpoint directly to create a message
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent,
          orderId: selectedMessage.orderId,
          subject: `הזמנה #${orderNumber}`
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message via API');
      }
      
      // Get the created message to update the UI immediately
      const createdMessage = await response.json();
      console.log('Message sent successfully:', createdMessage);
      
      // Immediately update the order's latest message in the sidebar
      setUserOrdersWithMessages(prev => {
        return prev.map(order => {
          if (order.orderId === selectedMessage.orderId) {
            // Create a new order with the latest message updated
            return {
              ...order,
              latestMessage: {
                ...order.latestMessage,
                content: messageContent,
                createdAt: new Date() // Use current date temporarily until refresh
              }
            };
          }
          return order;
        });
      });
      
      // Also refresh messages to get the actual server data
      fetchMessages();
      if (selectedOrderId) {
        fetchOrderMessages(selectedOrderId);
      }
      
      toast({
        title: 'הודעה נשלחה',
        description: 'ההודעה שלך נשלחה בהצלחה'
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשלוח את ההודעה',
        variant: 'destructive'
      });
    } finally {
      setIsFirebaseMessagePending(false);
    }
  };

  // Removed handleCreateMessage function

  // Connect to WebSocket when component mounts
  useEffect(() => {
    if (!user) return;
    
    const connectWebSocket = () => {
      // Check if we already have an open connection
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        return;
      }
      
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connection established');
          // Authenticate with user ID
          ws.send(JSON.stringify({
            type: 'auth',
            userId: user.id,
            isAdmin: user.role === 'admin',
            isFromAdmin: user.role === 'admin'
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
          websocketRef.current = null;
          
          // Only attempt to reconnect if this wasn't an intentional close
          if (event.code !== 1000) {
            // Try to reconnect after a delay
            setTimeout(connectWebSocket, 3000);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
          // Don't close here, let the onclose handler deal with it
        };
        
        websocketRef.current = ws;
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        setIsConnected(false);
      }
    };
    
    connectWebSocket();
    
    return () => {
      // Clean up WebSocket connection on component unmount
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

  // Fetch messages directly from API instead of Firebase
  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      // First get order details to map ID to order number
      let orders = [];
      let orderNumberMap = new Map<number, string>();
      
      try {
        const ordersResponse = await fetch('/api/user/orders');
        if (!ordersResponse.ok) {
          // Get error details
          let errorDetails = "";
          try {
            const errorData = await ordersResponse.json();
            errorDetails = errorData.error || errorData.message || ordersResponse.statusText;
          } catch {
            errorDetails = ordersResponse.statusText;
          }
          
          console.warn(`Warning fetching orders: ${errorDetails} (${ordersResponse.status})`);
          // Continue execution - we'll just use order IDs directly if we can't map them
        } else {
          orders = await ordersResponse.json();
          orders.forEach((order: any) => {
            orderNumberMap.set(order.id, order.orderNumber);
          });
        }
      } catch (orderError) {
        console.warn('Error fetching order details:', orderError);
        // Continue execution - we'll just use order IDs directly
      }
      
      // Fetch all messages for this user (includes both sent and received)
      let messages = [];
      try {
        const response = await fetch('/api/messages');
        if (!response.ok) {
          // Get error details
          let errorDetails = "";
          try {
            const errorData = await response.json();
            errorDetails = errorData.error || errorData.message || response.statusText;
          } catch {
            errorDetails = response.statusText;
          }
          
          throw new Error(`Failed to fetch messages: ${errorDetails} (${response.status})`);
        }
        
        messages = await response.json();
        console.log(`Fetched ${messages.length} messages from API`);
      } catch (messagesError) {
        console.error('Error fetching messages:', messagesError);
        // Rethrow to be caught by outer try/catch
        throw messagesError;
      }
      
      // If no messages, return early with empty list
      if (!messages || messages.length === 0) {
        console.log('No messages found for this user');
        setUserOrdersWithMessages([]);
        setFirebaseMessages([]);
        return;
      }
      
      // Process messages to build order list with latest messages
      const orderMap = new Map<number, OrderWithLatestMessage>();
      
      // Handle missing properties defensively
      const safeMessages = messages.map((msg: any) => ({
        ...msg,
        orderId: msg.orderId || 0,
        content: msg.content || '',
        createdAt: msg.createdAt || new Date().toISOString(),
        isFromAdmin: msg.isFromAdmin || false,
        isRead: msg.isRead || false
      }));
      
      // First, group messages by order ID
      const messagesByOrder = new Map<number, Message[]>();
      
      safeMessages.forEach(message => {
        if (!message.orderId) return;
        
        const orderId = message.orderId;
        if (!messagesByOrder.has(orderId)) {
          messagesByOrder.set(orderId, []);
        }
        
        messagesByOrder.get(orderId)!.push(message);
      });
      
      // For each order, find the latest message and create the order entry
      messagesByOrder.forEach((messagesForOrder, orderId) => {
        // Before we sort, ensure we have the most accurate timestamps by normalizing them
        const normalizedMessages = messagesForOrder.map(msg => {
          if (typeof msg.createdAt === 'object' && msg.createdAt?.toDate) {
            return {
              ...msg,
              _sortTimestamp: new Date(msg.createdAt.toDate()).getTime()
            };
          } else {
            return {
              ...msg,
              _sortTimestamp: new Date(msg.createdAt).getTime()
            };
          }
        });
        
        // Sort messages for this order by date (newest first)
        const sortedOrderMessages = [...normalizedMessages].sort((a, b) => {
          return b._sortTimestamp - a._sortTimestamp; // newest first
        });
        
        // The first message in the sorted array is the latest
        const latestMessage = sortedOrderMessages[0];
        
        console.log(`Order ${orderId} latest message (sorted by newest first):`, latestMessage);
        
        // Create the order entry with the latest message
        orderMap.set(orderId, {
          orderId,
          orderNumber: orderNumberMap.get(orderId) || String(orderId),
          latestMessage: latestMessage,
          unreadCount: 0 // Initialize with 0, we'll count in second pass
        });
      });
      
      // Second pass - count unread messages from admins
      for (const message of safeMessages) {
        if (!message.orderId) continue;
        
        const orderId = message.orderId;
        const orderData = orderMap.get(orderId);
        
        // Debug log for message status
        console.log(`Message ${message.id}: isFromAdmin=${message.isFromAdmin}, isRead=${message.isRead}`);
        
        if (orderData && message.isFromAdmin && !message.isRead) {
          orderData.unreadCount++;
          console.log(`  Incrementing unread count for order ${orderId}`);
        }
      }
      
      // Convert to array and sort by latest message timestamp (newest first)
      const ordersList = Array.from(orderMap.values()).sort((a, b) => {
        const dateA = new Date(a.latestMessage.createdAt).getTime();
        const dateB = new Date(b.latestMessage.createdAt).getTime();
        return dateB - dateA; // Newest first for the order list
      });
      
      console.log(`Processed ${ordersList.length} orders with messages`);
      setUserOrdersWithMessages(ordersList);
      setFirebaseMessages(safeMessages);  // Keep this for compatibility
      
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Don't show toast for auth errors to avoid spamming the user
      if (!(error instanceof Error && error.message.includes('401'))) {
        toast({
          title: 'שגיאה',
          description: 'לא ניתן לטעון את ההודעות',
          variant: 'destructive'
        });
      }
      
      // Set empty lists to avoid rendering errors
      setUserOrdersWithMessages([]);
      setFirebaseMessages([]);
    }
  }, [user, toast]);

  // Fetch messages for the selected order
  const fetchOrderMessages = useCallback(async (orderId: number) => {
    if (!orderId) {
      setOrderMessages([]);
      return;
    }

    try {
      console.log(`Fetching messages for order ${orderId}`);
      const response = await fetch(`/api/orders/${orderId}/messages`);
      
      if (!response.ok) {
        // Get detailed error information from the response
        let errorDetails = "";
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.message || response.statusText;
        } catch {
          errorDetails = response.statusText;
        }
        
        throw new Error(`Failed to fetch messages for order ${orderId}: ${errorDetails} (${response.status})`);
      }
      
      const messages = await response.json();
      console.log(`Fetched ${messages.length} messages for order ${orderId} from API`);
      
      // Sort messages by createdAt timestamp in ASCENDING order (oldest first)
      const sortedMessages = [...messages].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB; // Oldest first
      });
      
      setOrderMessages(sortedMessages);
      
    } catch (error) {
      console.error(`Error fetching messages for order ${orderId}:`, error);
      // Display an error toast to the user
      toast({
        title: 'שגיאה בטעינת הודעות',
        description: `לא ניתן לטעון הודעות להזמנה ${orderId}`,
        variant: 'destructive'
      });
      setOrderMessages([]);
    }
  }, [toast]);

  // Initial fetch and refresh messages periodically
  useEffect(() => {
    fetchMessages();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Fetch order messages when an order is selected
  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderMessages(selectedOrderId);
      
      // Poll for updates every 5 seconds
      const interval = setInterval(() => fetchOrderMessages(selectedOrderId), 5000);
      
      return () => clearInterval(interval);
    }
  }, [selectedOrderId, fetchOrderMessages]);

  // Function to manually refresh messages for an order
  const refreshOrderMessages = (orderId: number) => {
    if (orderId === selectedOrderId) {
      fetchOrderMessages(orderId);
    }
    // Also refresh all messages to update the sidebar
    fetchMessages();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const chatContainer = document.getElementById('chat-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [selectedMessage, orderMessages]);

  // Auto-scroll to bottom for order messages
  useEffect(() => {
    const orderChatContainer = document.getElementById('chat-container-orders');
    if (orderChatContainer) {
      orderChatContainer.scrollTop = orderChatContainer.scrollHeight;
    }
  }, [orderMessages]);

  // Update document title
  useEffect(() => {
    document.title = "הודעות שלי | אור מיה";
  }, []);

  // If user is not logged in or is an admin, don't allow access to this page
  if (!user || user.role === 'admin') {
    return (
      <MainLayout>
        <div className="container max-w-5xl py-8 mt-12">
          <Card>
            <CardHeader>
              <CardTitle>הודעות שלי</CardTitle>
              <CardDescription>
                {!user 
                  ? 'עליך להתחבר כדי לצפות בהודעות שלך'
                  : 'מנהלים מתבקשים להשתמש בממשק הניהול לצפייה בהודעות'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user ? (
                <Button onClick={() => navigate('/auth')}>התחבר</Button>
              ) : (
                <Button onClick={() => navigate('/admin/messages')}>עבור לממשק ניהול</Button>
              )}
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
                  <div className="p-3 border-b bg-white">
                    <h3 className="font-semibold">הודעות לפי הזמנה</h3>
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
                                // Use our new API endpoint to mark all messages for this order as read
                                apiRequest('POST', `/api/messages/mark-read-by-order/${order.orderId}`)
                                  .then((response) => {
                                    if (response.ok) {
                                      // After successfully marking as read, invalidate the unread count query
                                      // to update badges elsewhere
                                      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
                                      
                                      console.log(`Successfully marked messages as read for order ${order.orderId}`);
                                      
                                      // Also invalidate the messages query to refresh the message list
                                      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
                                      queryClient.invalidateQueries({ queryKey: [`/api/orders/${order.orderId}/messages`] });
                                    }
                                  })
                                  .catch((error) => {
                                    console.error("Error marking messages as read:", error);
                                  });
                                
                                // Update the local state immediately to hide the unread badge
                                setUserOrdersWithMessages(prevOrders => 
                                  prevOrders.map(prevOrder => {
                                    if (prevOrder.orderId === order.orderId) {
                                      return { ...prevOrder, unreadCount: 0 };
                                    }
                                    return prevOrder;
                                  })
                                );
                              }
                            }}
                          >
                            <div className="flex flex-col">
                              <div className="flex justify-between items-start">
                                <div className="flex-1 overflow-hidden">
                                  <div className="flex items-center">
                                    <p className="font-medium truncate">הזמנה מספר {order.orderNumber || order.orderId}</p>
                                    {order.unreadCount > 0 && (
                                      <Badge variant="destructive" className="ml-2">
                                        {order.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {typeof order.latestMessage.createdAt === 'object' && order.latestMessage.createdAt?.toDate ? 
                                    format(new Date(order.latestMessage.createdAt.toDate()), 'dd/MM/yyyy', { locale: he }) :
                                    format(new Date(order.latestMessage.createdAt), 'dd/MM/yyyy', { locale: he })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 truncate">
                                {order.latestMessage && order.latestMessage.content ? 
                                  (order.latestMessage.content.substring(0, 40) + 
                                   (order.latestMessage.content.length > 40 ? '...' : '')) 
                                  : 'אין תוכן הודעה'}
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
                              (הזמנה מספר {
                                userOrdersWithMessages.find(order => order.orderId === selectedMessage.orderId)?.orderNumber || 
                                selectedMessage.orderId
                              })
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
                                const isFromUser = !message.isFromAdmin;
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
                            </div>
                          )}
                          {/* No longer need a ref here */}
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
                                      isFromAdmin: false,
                                      orderId: selectedMessage.orderId || 0,
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