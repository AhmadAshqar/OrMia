import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

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
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
    
    // Scroll to the bottom of the messages
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedMessage]);

  // Handle message click
  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
  };

  // Handle reply submit
  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;
    if (!replyContent.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין תוכן להודעה',
        variant: 'destructive'
      });
      return;
    }
    
    // If WebSocket is connected, send the message through it
    if (websocketRef.current && 
        websocketRef.current.readyState === WebSocket.OPEN && 
        selectedMessage.orderId) {
      websocketRef.current.send(JSON.stringify({
        type: 'message',
        content: replyContent,
        orderId: selectedMessage.orderId,
        parentId: selectedMessage.id
      }));
      
      setReplyContent('');
    } else {
      // Fallback to REST API if WebSocket is not connected
      replyMutation.mutate({ messageId: selectedMessage.id, content: replyContent });
    }
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
                <div className="mb-4">
                  <Select
                    value={selectedUserId?.toString() || 'all'}
                    onValueChange={(value) => setSelectedUserId(value === 'all' ? null : parseInt(value))}
                  >
                    <SelectTrigger className="w-full md:w-80">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 border rounded-lg overflow-hidden h-[600px]">
                    {isLoadingAllMessages ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !selectedUserId ? (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-muted-foreground">יש לבחור משתמש לצפייה בהודעות</p>
                      </div>
                    ) : allMessages && allMessages.length > 0 ? (
                      <div className="h-full flex flex-col">
                        <div className="p-3 border-b">
                          <h3 className="text-lg font-semibold">
                            {users?.find((u: any) => u.id === selectedUserId)?.username || "משתמש"}
                          </h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                          <MessageThread 
                            messages={getMessagesForSelectedUser(allMessages)}
                            onMessageClick={handleMessageClick}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center h-full">
                        <p className="text-muted-foreground">אין הודעות למשתמש זה</p>
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 border rounded-lg overflow-hidden h-[600px]">
                    {selectedMessage ? (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-auto p-4 bg-gray-50">
                          <ChatThread 
                            messages={getMessagesForSelectedUser(allMessages)}
                            currentUserId={0} // Admin is always 0 in chat view
                          />
                          <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t bg-white">
                          <form onSubmit={handleReplySubmit} className="flex">
                            <Textarea
                              className="flex-1 resize-none"
                              placeholder="כתוב הודעה..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              dir="rtl"
                            />
                            <Button 
                              type="submit" 
                              className="ms-2 self-end"
                              disabled={replyMutation.isPending || !replyContent.trim()}
                            >
                              {replyMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'שלח'
                              )}
                            </Button>
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
  // Combine messages and their replies into a single chronological thread
  const allMessages = messages.flatMap((message) => {
    const threadMessages = [
      {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        isFromAdmin: message.isFromAdmin || false,
        userId: message.userId
      }
    ];
    
    if (message.replies) {
      message.replies.forEach((reply) => {
        threadMessages.push({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          isFromAdmin: reply.isFromAdmin || false,
          userId: reply.userId
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
    <div className="space-y-4">
      {sortedMessages.map((msg) => {
        const isCurrentUser = currentUserId === msg.userId;
        const isAdmin = msg.isFromAdmin;
        
        return (
          <div 
            key={msg.id}
            className={`flex ${isCurrentUser || isAdmin ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`rounded-lg p-3 max-w-[80%] ${
                isCurrentUser || isAdmin 
                  ? 'bg-primary/10 text-right' 
                  : 'bg-gray-200 text-left'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(msg.createdAt), 'HH:mm', { locale: he })}
              </p>
            </div>
          </div>
        );
      })}
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
          <div className="flex-1 overflow-auto p-4">
            <div className="mb-4">
              <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
            </div>
            
            {selectedMessage.replies && selectedMessage.replies.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-medium border-b pb-2">תגובות</h4>
                {selectedMessage.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`p-3 rounded-lg ${
                      reply.isFromAdmin ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium">
                        {reply.isFromAdmin ? 'מנהל' : (reply.user?.username || 'משתמש')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(reply.createdAt), 'dd/MM/yyyy HH:mm', {
                          locale: he,
                        })}
                      </p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-white">
            <form onSubmit={handleReplySubmit} className="flex">
              <Textarea
                className="flex-1 resize-none"
                placeholder="כתוב הודעה..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                dir="rtl"
              />
              <Button 
                type="submit" 
                className="ms-2 self-end"
                disabled={isReplying || !replyContent.trim()}
              >
                {isReplying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'שלח'
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