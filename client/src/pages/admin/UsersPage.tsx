import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  UserPlus,
  CheckCircle,
  XCircle,
  PlusCircle,
  Lock,
  Key
} from "lucide-react";

export default function UsersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formState, setFormState] = useState<Partial<User>>({});
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"]
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const res = await apiRequest("POST", "/api/admin/users", userData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "שגיאה ביצירת משתמש");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "משתמש נוצר בהצלחה",
        description: "המשתמש נוסף למערכת בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה ביצירת משתמש",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "שגיאה בעדכון משתמש");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "משתמש עודכן בהצלחה",
        description: "פרטי המשתמש עודכנו בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון משתמש",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      toast({
        title: "משתמש נמחק בהצלחה",
        description: "המשתמש הוסר מהמערכת בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה במחיקת משתמש",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Password Reset Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number, password: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${id}/reset-password`, { password });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "שגיאה באיפוס סיסמה");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setPasswordResetDialogOpen(false);
      setUserToResetPassword(null);
      setNewPassword("");
      toast({
        title: "סיסמה אופסה בהצלחה",
        description: "סיסמת המשתמש עודכנה בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה באיפוס סיסמה",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormState({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "customer",
    });
    setEditingUser(null);
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormState({
        username: user.username,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role || "customer",
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    deleteUserMutation.mutate(userToDelete.id);
  };
  
  const handleOpenPasswordResetDialog = (user: User) => {
    setUserToResetPassword(user);
    setNewPassword('');
    setPasswordResetDialogOpen(true);
  };
  
  const handleResetPassword = () => {
    if (!userToResetPassword || !newPassword) {
      toast({
        title: "מידע חסר",
        description: "יש להזין סיסמה חדשה",
        variant: "destructive",
      });
      return;
    }
    
    resetPasswordMutation.mutate({ 
      id: userToResetPassword.id, 
      password: newPassword 
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormState({
        ...formState,
        [name]: checked
      });
    } else {
      setFormState({
        ...formState,
        [name]: value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.username || !formState.email) {
      toast({
        title: "מידע חסר",
        description: "יש להזין שם משתמש ודוא\"ל",
        variant: "destructive",
      });
      return;
    }

    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data: formState });
    } else {
      if (!formState.password) {
        toast({
          title: "מידע חסר",
          description: "יש להזין סיסמה עבור המשתמש החדש",
          variant: "destructive",
        });
        return;
      }
      createUserMutation.mutate(formState);
    }
  };

  const isLoading = usersLoading;
  const isPending = createUserMutation.isPending || updateUserMutation.isPending;

  // Filter users based on search term
  const filteredUsers = users ? users.filter(user => {
    const username = user.username.toLowerCase();
    const email = user.email?.toLowerCase() || "";
    const firstName = user.firstName?.toLowerCase() || "";
    const lastName = user.lastName?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();
    
    return username.includes(searchLower) || 
           email.includes(searchLower) || 
           firstName.includes(searchLower) ||
           lastName.includes(searchLower);
  }) : [];

  // Format date
  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: he });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול משתמשים</h1>
        <Button onClick={() => handleOpenDialog()}>
          <UserPlus className="ml-2 h-5 w-5" />
          הוסף משתמש חדש
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center border rounded-lg px-3 py-2 max-w-md">
            <Search className="h-5 w-5 text-muted-foreground ml-2" />
            <Input 
              placeholder="חפש לפי שם משתמש, שם מלא או אימייל"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">רשימת משתמשים</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם משתמש</TableHead>
                    <TableHead>שם מלא</TableHead>
                    <TableHead>דוא"ל</TableHead>
                    <TableHead>הרשאות מנהל</TableHead>
                    <TableHead>תאריך הצטרפות</TableHead>
                    <TableHead>התחברות אחרונה</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || user.lastName || '-')}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                          }`}>
                            {user.role === 'admin' ? 'מנהל' : 'משתמש רגיל'}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0" 
                              onClick={() => handleOpenDialog(user)}
                              title="ערוך משתמש"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-amber-600" 
                              onClick={() => handleOpenPasswordResetDialog(user)}
                              title="שנה סיסמה"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-600" 
                              onClick={() => handleOpenDeleteDialog(user)}
                              title="מחק משתמש"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        {searchTerm ? 'לא נמצאו תוצאות לחיפוש' : 'לא נמצאו משתמשים'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'עריכת משתמש' : 'הוספת משתמש חדש'}</DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'ערוך את פרטי המשתמש' 
                : 'הוסף משתמש חדש למערכת'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="username">שם משתמש</Label>
                <Input
                  id="username"
                  name="username"
                  value={formState.username || ''}
                  onChange={handleInputChange}
                  disabled={!!editingUser}
                  placeholder="הזן שם משתמש"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">דוא"ל</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formState.email || ''}
                  onChange={handleInputChange}
                  placeholder="הזן דואר אלקטרוני"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">שם פרטי</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formState.firstName || ''}
                    onChange={handleInputChange}
                    placeholder="הזן שם פרטי"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">שם משפחה</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formState.lastName || ''}
                    onChange={handleInputChange}
                    placeholder="הזן שם משפחה"
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">
                  {editingUser ? 'שינוי סיסמה (השאר ריק לשמירת הסיסמה הקיימת)' : 'סיסמה'}
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formState.password || ''}
                  onChange={handleInputChange}
                  placeholder={editingUser ? "הזן סיסמה חדשה" : "הזן סיסמה"}
                  required={!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-muted-foreground mt-1">
                    * שים לב: השארת שדה זה ריק תשמור על הסיסמה הקיימת
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">הרשאות</Label>
                <select
                  id="role"
                  name="role"
                  value={formState.role || 'customer'}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="customer">משתמש רגיל</option>
                  <option value="admin">מנהל</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto"></div>
                ) : (
                  editingUser ? 'עדכן משתמש' : 'צור משתמש'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>מחיקת משתמש</DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את המשתמש?
              פעולה זו אינה ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          
          {userToDelete && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg mb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="font-medium">שם משתמש:</span>
                    <span>{userToDelete.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">דוא"ל:</span>
                    <span>{userToDelete.email}</span>
                  </div>
                  {(userToDelete.firstName || userToDelete.lastName) && (
                    <div className="flex justify-between">
                      <span className="font-medium">שם מלא:</span>
                      <span>
                        {userToDelete.firstName && userToDelete.lastName 
                          ? `${userToDelete.firstName} ${userToDelete.lastName}`
                          : (userToDelete.firstName || userToDelete.lastName)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setDeleteDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="ml-2 h-4 w-4" />
                  ביטול
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteUser} 
                  disabled={deleteUserMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {deleteUserMutation.isPending ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto"></div>
                  ) : (
                    <>
                      <Trash2 className="ml-2 h-4 w-4" />
                      מחק משתמש
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetDialogOpen} onOpenChange={setPasswordResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>שינוי סיסמה למשתמש</DialogTitle>
            <DialogDescription>
              הזן סיסמה חדשה עבור המשתמש
            </DialogDescription>
          </DialogHeader>
          
          {userToResetPassword && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg mb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <span className="font-medium">שם משתמש:</span>
                    <span>{userToResetPassword.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">דוא"ל:</span>
                    <span>{userToResetPassword.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">סיסמה חדשה</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="הזן סיסמה חדשה"
                    required
                    className="border-input"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex flex-col sm:flex-row gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setPasswordResetDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="ml-2 h-4 w-4" />
                  ביטול
                </Button>
                <Button 
                  variant="default" 
                  onClick={handleResetPassword} 
                  disabled={resetPasswordMutation.isPending || !newPassword}
                  className="w-full sm:w-auto"
                >
                  {resetPasswordMutation.isPending ? (
                    <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto"></div>
                  ) : (
                    <>
                      <Key className="ml-2 h-4 w-4" />
                      עדכן סיסמה
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}