import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, UserRound, LockKeyhole, Package, Heart, ChevronLeft } from "lucide-react";

// Profile form schema
const profileSchema = z.object({
  firstName: z.string().min(2, { message: "שם פרטי חייב להכיל לפחות 2 תווים" }).nullable().optional(),
  lastName: z.string().min(2, { message: "שם משפחה חייב להכיל לפחות 2 תווים" }).nullable().optional(),
  email: z.string().email({ message: "כתובת אימייל לא תקינה" }),
  phone: z.string().min(9, { message: "מספר טלפון לא תקין" }).max(10).nullable().optional(),
  address: z.string().min(2, { message: "כתובת חייבת להכיל לפחות 2 תווים" }).nullable().optional(),
  apartment: z.string().nullable().optional(),
  city: z.string().min(2, { message: "עיר חייבת להכיל לפחות 2 תווים" }).nullable().optional(),
  postalCode: z.string().nullable().optional(),
  country: z.string().default("ישראל").nullable().optional(),
});

// Password form schema
const passwordSchema = z.object({
  currentPassword: z.string().min(6, { message: "סיסמה נוכחית חייבת להכיל לפחות 6 תווים" }),
  newPassword: z.string().min(8, { message: "סיסמה חדשה חייבת להכיל לפחות 8 תווים" }),
  confirmPassword: z.string().min(8, { message: "אימות סיסמה חייב להכיל לפחות 8 תווים" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

// Type definitions from schemas
type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Initialize forms
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      apartment: user?.apartment || "",
      city: user?.city || "",
      postalCode: user?.postalCode || "",
      country: user?.country || "ישראל",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data);
      toast({
        description: "הפרופיל עודכן בהצלחה",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון הפרופיל",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Password update mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      const res = await apiRequest("PATCH", "/api/user/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        description: "הסיסמה עודכנה בהצלחה",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון הסיסמה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handlers
  function onProfileSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(data);
  }

  function onPasswordSubmit(data: PasswordFormValues) {
    updatePasswordMutation.mutate(data);
  }

  // If user is not available yet
  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-l from-amber-200 to-amber-600 bg-clip-text text-transparent">
            הפרופיל שלי
          </h1>
          <p className="text-muted-foreground mt-2">
            עדכון פרטים אישיים וניהול החשבון שלך
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Quick Links to Other User Pages */}
          <div className="flex justify-center mb-8 gap-4">
            <Button asChild variant="outline" className="border-amber-200 hover:border-amber-400 hover:bg-amber-50">
              <Link href="/orders" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>ההזמנות שלי</span>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-amber-200 hover:border-amber-400 hover:bg-amber-50">
              <Link href="/favorites" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span>המועדפים שלי</span>
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/30">
              <TabsTrigger value="profile" className="flex items-center gap-2 py-3">
                <UserRound className="h-4 w-4" />
                <span>פרטים אישיים</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 py-3">
                <LockKeyhole className="h-4 w-4" />
                <span>אבטחה</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-0">
              <Card className="border border-amber-200">
                <CardHeader>
                  <CardTitle>פרטים אישיים</CardTitle>
                  <CardDescription>
                    עדכן את הפרטים האישיים שלך
                  </CardDescription>
                </CardHeader>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>שם פרטי</FormLabel>
                              <FormControl>
                                <Input dir="rtl" placeholder="שם פרטי" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>שם משפחה</FormLabel>
                              <FormControl>
                                <Input dir="rtl" placeholder="שם משפחה" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>דואר אלקטרוני</FormLabel>
                            <FormControl>
                              <Input dir="ltr" placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>טלפון</FormLabel>
                            <FormControl>
                              <Input dir="ltr" placeholder="טלפון" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="pt-6 border-t">
                        <h3 className="text-md font-semibold mb-4">פרטי משלוח</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>כתובת</FormLabel>
                                <FormControl>
                                  <Input dir="rtl" placeholder="רחוב ומספר בית" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="apartment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>דירה/קומה (אופציונלי)</FormLabel>
                                <FormControl>
                                  <Input dir="rtl" placeholder="דירה או קומה" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>עיר</FormLabel>
                                <FormControl>
                                  <Input dir="rtl" placeholder="עיר" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>מיקוד</FormLabel>
                                <FormControl>
                                  <Input dir="ltr" placeholder="מיקוד" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>מדינה</FormLabel>
                                <FormControl>
                                  <Input dir="rtl" placeholder="מדינה" {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-start border-t p-4">
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            מעדכן...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            שמור שינויים
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <Card className="border border-amber-200">
                <CardHeader>
                  <CardTitle>שינוי סיסמה</CardTitle>
                  <CardDescription>
                    עדכן את הסיסמה לחשבון שלך
                  </CardDescription>
                </CardHeader>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                    <CardContent className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>סיסמה נוכחית</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="הזן את הסיסמה הנוכחית" 
                                dir="ltr"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>סיסמה חדשה</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="הזן סיסמה חדשה" 
                                dir="ltr"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>אימות סיסמה</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="הזן שוב את הסיסמה החדשה" 
                                dir="ltr"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter className="flex justify-start border-t p-4">
                      <Button 
                        type="submit" 
                        className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white"
                        disabled={updatePasswordMutation.isPending}
                      >
                        {updatePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            מעדכן...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            עדכן סיסמה
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}