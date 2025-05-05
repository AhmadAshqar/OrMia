import { useState, useEffect, useRef } from 'react';
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
import { Loader2, CheckCheck } from 'lucide-react';
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
  const [isConnected, setIsConnected] = useState(false);
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
            
            // Scroll to the bottom of the messages
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
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
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN && selectedMessage.orderId) {
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
                            צ'אט עם צוות אור מיה
                          </p>
                        </div>
                        <div className="flex-1 overflow-auto p-4 bg-gray-50">
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
                            
                            {/* Replies in chronological order */}
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
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
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
                                <button type="button" className="text-gray-500 hover:text-blue-500 p-1 rounded-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                    <line x1="9" y1="9" x2="9.01" y2="9" />
                                    <line x1="15" y1="9" x2="15.01" y2="9" />
                                  </svg>
                                </button>
                                <button type="button" className="text-gray-500 hover:text-blue-500 p-1 rounded-full">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                </button>
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