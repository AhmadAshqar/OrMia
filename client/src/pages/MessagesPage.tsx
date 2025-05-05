import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Message } from '@shared/schema';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 border rounded-lg overflow-hidden h-[600px]">
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
                            } ${!message.isRead && !message.isFromAdmin ? 'font-bold' : ''}`}
                            onClick={() => handleMessageClick(message)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-center">
                                  <p className="font-medium truncate">{message.subject}</p>
                                  {!message.isRead && (
                                    <Badge variant="outline" className="text-primary ml-2">
                                      חדש
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {message.content.substring(0, 50)}
                                  {message.content.length > 50 ? '...' : ''}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                            </p>
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
                  <div className="md:col-span-2 border rounded-lg overflow-hidden h-[600px]">
                    {selectedMessage ? (
                      <div className="h-full flex flex-col">
                        <div className="p-4 border-b">
                          <h3 className="text-lg font-semibold">{selectedMessage.subject}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(selectedMessage.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </p>
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
                                    reply.isFromAdmin ? 'bg-muted ml-8' : 'bg-primary/10 mr-8'
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <p className="text-sm font-medium">
                                      {reply.isFromAdmin ? 'צוות אור מיה' : 'אני'}
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
                              disabled={replyMutation.isPending}
                            >
                              {replyMutation.isPending ? (
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
                </div>
              </TabsContent>
              <TabsContent value="orders">
                <div className="flex flex-col justify-center items-center h-[500px] p-4 text-center">
                  <p className="mb-4 text-muted-foreground">לצפייה בהודעות לפי הזמנה, אנא בקר בדף ההזמנות שלי</p>
                  <Button onClick={() => navigate('/orders')}>
                    עבור לדף ההזמנות שלי
                  </Button>
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