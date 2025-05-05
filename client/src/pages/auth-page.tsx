import { useAuth, loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Redirect, useLocation, Link } from "wouter";
import { Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState, useEffect } from "react";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation, forgotPasswordMutation, resetPasswordMutation } = useAuth();
  const [_, navigate] = useLocation();
  const [isFormReady, setIsFormReady] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Get URL parameters for reset token and mode
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode");
  const resetToken = searchParams.get("reset");
  const defaultTab = mode === "register" ? "register" : "login";
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(!!resetToken);

  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: resetToken || "",
      password: "",
      confirmPassword: "",
    },
  });
  
  // Effect to handle form initialization
  useEffect(() => {
    // Delay form initialization to improve initial page load
    const timer = setTimeout(() => {
      setIsFormReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Effect to handle reset token
  useEffect(() => {
    if (resetToken) {
      resetPasswordForm.setValue("token", resetToken);
      setIsResetPasswordOpen(true);
    }
  }, [resetToken, resetPasswordForm]);
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: null,
      lastName: null,
      role: "customer",
      acceptTerms: false,
    },
  });

  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    try {
      await loginMutation.mutateAsync(values);
    } catch (error) {
      console.error("Login failed:", error);
    }
  }

  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    try {
      await registerMutation.mutateAsync(values);
    } catch (error) {
      console.error("Registration failed:", error);
    }
  }
  
  async function onForgotPasswordSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    try {
      await forgotPasswordMutation.mutateAsync(values);
      setIsForgotPasswordOpen(false);
      forgotPasswordForm.reset();
    } catch (error) {
      console.error("Password reset request failed:", error);
    }
  }
  
  async function onResetPasswordSubmit(values: z.infer<typeof resetPasswordSchema>) {
    try {
      await resetPasswordMutation.mutateAsync(values);
      setIsResetPasswordOpen(false);
      resetPasswordForm.reset();
    } catch (error) {
      console.error("Password reset failed:", error);
    }
  }

  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col md:flex-row-reverse bg-black overflow-hidden relative pt-20">
        {/* Gold particle animations - reduced for performance */}
        <div className="absolute w-6 h-6 rounded-full bg-amber-400/10 top-1/4 left-1/4"></div>
        <div className="absolute w-8 h-8 rounded-full bg-amber-400/5 top-3/4 left-1/3"></div>
        <div className="absolute w-5 h-5 rounded-full bg-amber-400/15 top-1/2 right-1/4"></div>
        
        <div className="w-full md:w-1/2 p-10 flex items-center justify-center relative z-10">
          <div className="max-w-lg">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-right text-gold-gradient">
              ברוכים הבאים לעולם המויסנייט
            </h1>
            <p className="text-lg text-right text-amber-300 mb-8 font-alef leading-relaxed">
              הכנס לחשבונך כדי לצפות בהזמנות שלך, לשמור מוצרים ברשימת המשאלות
              וליהנות מחווית קניה מותאמת אישית.
            </p>
            <div className="flex justify-end">
              <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-[hsl(var(--gold))] to-transparent rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-10 flex items-center justify-center">
          <div className="w-full max-w-md rtl gold-gradient-bg luxury-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold mb-3 text-black">
                התחבר לחשבונך
              </h2>
              <p className="text-amber-900 font-alef">
                או צור חשבון חדש כדי להתחיל
              </p>
              <div className="h-0.5 w-24 mx-auto mt-4 bg-gradient-to-r from-transparent via-black to-transparent"></div>
            </div>

            <Tabs
              defaultValue={defaultTab}
              className="w-full space-y-6 tabs-gold"
            >
              <TabsList className="mb-6">
                <TabsTrigger
                  value="login"
                  className="px-6 py-3 font-alef"
                >
                  התחברות
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="px-6 py-3 font-alef"
                >
                  הרשמה
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                {!isFormReady ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-800" />
                  </div>
                ) : (
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="text-right">
                            <FormLabel className="form-label-gold">
                              שם משתמש
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="form-input-gold"
                                placeholder="הזן את שם המשתמש שלך"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="text-right">
                            <FormLabel className="form-label-gold">סיסמה</FormLabel>
                            <FormControl>
                              <Input
                                className="form-input-gold"
                                type="password"
                                placeholder="הזן את הסיסמה שלך"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full btn-luxury shadow-lg shadow-black/40 py-6 text-lg"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            מתחבר...
                          </div>
                        ) : (
                          "התחבר"
                        )}
                      </Button>
                      
                      <div className="mt-4 text-center">
                        <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="link"
                              className="text-amber-700 hover:text-amber-900 hover:underline"
                            >
                              שכחת את הסיסמה?
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rtl gold-gradient-bg luxury-card">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-serif font-bold text-center text-black">
                                איפוס סיסמה
                              </DialogTitle>
                              <DialogDescription className="text-center text-amber-900 mt-2">
                                אנא הזן את כתובת הדוא״ל שלך ואנו נשלח לך קישור לאיפוס הסיסמה
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...forgotPasswordForm}>
                              <form
                                onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}
                                className="space-y-4 mt-4"
                              >
                                <FormField
                                  control={forgotPasswordForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem className="text-right">
                                      <FormLabel className="form-label-gold">
                                        דוא"ל
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          className="form-input-gold"
                                          placeholder="הזן את כתובת הדוא״ל שלך"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-between space-x-4 space-x-reverse">
                                  <DialogClose asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className="flex-1 border-amber-700 text-amber-900 hover:bg-amber-100"
                                    >
                                      ביטול
                                    </Button>
                                  </DialogClose>
                                  <Button
                                    type="submit"
                                    className="flex-1 btn-luxury"
                                    disabled={forgotPasswordMutation.isPending}
                                  >
                                    {forgotPasswordMutation.isPending ? (
                                      <div className="flex items-center">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        שולח...
                                      </div>
                                    ) : (
                                      "שלח קישור איפוס"
                                    )}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </form>
                  </Form>
                )}
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                {!isFormReady ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-800" />
                  </div>
                ) : (
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem className="text-right">
                              <FormLabel className="form-label-gold">
                                שם פרטי
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="form-input-gold"
                                  placeholder="שם פרטי"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem className="text-right">
                              <FormLabel className="form-label-gold">
                                שם משפחה
                              </FormLabel>
                              <FormControl>
                                <Input
                                  className="form-input-gold"
                                  placeholder="שם משפחה"
                                  {...field}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem className="text-right">
                            <FormLabel className="form-label-gold">
                              שם משתמש
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="form-input-gold"
                                placeholder="צור שם משתמש ייחודי"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="text-right">
                            <FormLabel className="form-label-gold">דוא"ל</FormLabel>
                            <FormControl>
                              <Input
                                className="form-input-gold"
                                placeholder="הזן את כתובת הדוא״ל שלך"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem className="text-right">
                            <FormLabel className="form-label-gold">סיסמה</FormLabel>
                            <FormControl>
                              <Input
                                className="form-input-gold"
                                type="password"
                                placeholder="צור סיסמה חזקה"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem className="text-right">
                            <FormLabel className="form-label-gold">
                              אימות סיסמה
                            </FormLabel>
                            <FormControl>
                              <Input
                                className="form-input-gold"
                                type="password"
                                placeholder="הזן שוב את הסיסמה"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4 mt-4 bg-amber-50">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-amber-700 data-[state=checked]:text-white"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none text-right">
                              <FormLabel className="text-amber-900">
                                אני מסכים/ה ל<Link href="/terms" className="text-amber-700 hover:underline">תנאי השימוש</Link>,&nbsp;
                                <Link href="/privacy" className="text-amber-700 hover:underline">מדיניות הפרטיות</Link>,&nbsp;
                                <Link href="/shipping-policy" className="text-amber-700 hover:underline">מדיניות המשלוחים</Link> ומאשר/ת כי קראתי את&nbsp;
                                <Link href="/disclosure" className="text-amber-700 hover:underline">גילוי נאות לצרכן</Link>.
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Button
                        type="submit"
                        className="w-full btn-luxury shadow-lg shadow-black/40 py-6 text-lg"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            יוצר חשבון...
                          </div>
                        ) : (
                          "הרשם"
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <Footer />

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="rtl gold-gradient-bg luxury-card">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-bold text-center text-black">
              סיסמה חדשה
            </DialogTitle>
            <DialogDescription className="text-center text-amber-900 mt-2">
              אנא הזן את הסיסמה החדשה שלך
            </DialogDescription>
          </DialogHeader>
          <Form {...resetPasswordForm}>
            <form
              onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}
              className="space-y-4 mt-4"
            >
              <input type="hidden" {...resetPasswordForm.register("token")} />
              
              <FormField
                control={resetPasswordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="form-label-gold">
                      סיסמה חדשה
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="form-input-gold"
                        type="password"
                        placeholder="הזן סיסמה חדשה"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={resetPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="text-right">
                    <FormLabel className="form-label-gold">
                      אימות סיסמה
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="form-input-gold"
                        type="password"
                        placeholder="הזן שוב את הסיסמה החדשה"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-between space-x-4 space-x-reverse">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-amber-700 text-amber-900 hover:bg-amber-100"
                  >
                    ביטול
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  className="flex-1 btn-luxury"
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      מעדכן...
                    </div>
                  ) : (
                    "עדכן סיסמה"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}