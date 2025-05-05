import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | string | null>(null);

  // Query to fetch all unread messages
  const { data: unreadMessages, isLoading: isLoadingUnread } = useQuery({
    queryKey: ['/api/admin/messages/unread'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/messages/unread');
      return response.json();
    }
  });

  // Query to fetch all messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/messages');
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

  // Effect to handle message selection
  useEffect(() => {
    if (selectedMessage && !selectedMessage.isRead) {
      markAsReadMutation.mutate(selectedMessage.id);
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
    replyMutation.mutate({ messageId: selectedMessage.id, content: replyContent });
  };

  // Filter messages for search
  const filteredMessages = messages ? messages.filter((message: Message) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      message.subject?.toLowerCase().includes(searchLower) ||
      message.content?.toLowerCase().includes(searchLower) ||
      message.user?.username?.toLowerCase().includes(searchLower) ||
      message.user?.email?.toLowerCase().includes(searchLower)
    );
  }) : [];

  // Determine which messages to display based on the active tab
  const getActiveMessages = (tabValue: string) => {
    if (tabValue === 'unread' && unreadMessages) {
      return unreadMessages;
    } else if (tabValue === 'search' && messages) {
      return filteredMessages;
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
            <Tabs defaultValue="unread" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
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
                    {isLoadingMessages ? (
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
          <div className="p-4 border-t bg-card">
            <form onSubmit={handleReplySubmit} className="flex flex-col">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="הקלד את תשובתך כאן..."
                className="min-h-[100px] mb-2"
                dir="rtl"
              />
              <Button
                type="submit"
                className="self-start"
                disabled={isReplying}
              >
                {isReplying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    שולח...
                  </>
                ) : (
                  'שלח תשובה'
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