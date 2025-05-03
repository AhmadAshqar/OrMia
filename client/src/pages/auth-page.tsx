import { useAuth, loginSchema, registerSchema } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [_, navigate] = useLocation();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
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
    },
  });

  // Handle login submission
  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    try {
      await loginMutation.mutateAsync(values);
      // If successful, user state will be updated via the mutation's onSuccess
      // and the component will auto-redirect via the user check above
    } catch (error) {
      console.error("Login failed:", error);
      // Error is already handled by the mutation's onError callback
    }
  }

  // Handle registration submission
  async function onRegisterSubmit(values: z.infer<typeof registerSchema>) {
    try {
      await registerMutation.mutateAsync(values);
      // If successful, user state will be updated via the mutation's onSuccess
      // and the component will auto-redirect via the user check above
    } catch (error) {
      console.error("Registration failed:", error);
      // Error is already handled by the mutation's onError callback
    }
  }

  // Redirect if user is already logged in
  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  // Get the mode from URL (login or register)
  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get('mode');
  const defaultTab = mode === 'register' ? 'register' : 'login';

  return (
    <div className="min-h-screen flex flex-col md:flex-row-reverse">
      {/* Hero section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-gold-100 to-gold-300 p-10 flex items-center justify-center">
        <div className="max-w-lg">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-right text-gold-800">
            ברוכים הבאים לעולם המויסנייט
          </h1>
          <p className="text-lg text-right text-gold-700 mb-6">
            הכנס לחשבונך כדי לצפות בהזמנות שלך, לשמור מוצרים ברשימת המשאלות וליהנות מחווית קניה מותאמת אישית.
          </p>
          <div className="flex justify-end">
            <div className="w-20 h-1 bg-gold-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Form section */}
      <div className="w-full md:w-1/2 p-6 md:p-10 flex items-center justify-center">
        <div className="w-full max-w-md space-y-6 rtl bg-[hsl(var(--gold))] text-black p-8 rounded-lg shadow-2xl border-2 border-amber-300 shadow-amber-100/60">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-playfair font-bold text-gold-800 mb-2">התחבר לחשבונך</h2>
            <p className="text-gray-600">או צור חשבון חדש כדי להתחיל</p>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full space-y-6 tabs-gold">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">התחברות</TabsTrigger>
              <TabsTrigger value="register">הרשמה</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login" className="space-y-4">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="form-label-gold">שם משתמש</FormLabel>
                        <FormControl>
                          <Input className="form-input-gold" placeholder="הזן את שם המשתמש שלך" {...field} />
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
                          <Input className="form-input-gold" type="password" placeholder="הזן את הסיסמה שלך" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-dark))] text-white shadow-lg shadow-amber-300/40"
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
                </form>
              </Form>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register" className="space-y-4">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="text-right">
                          <FormLabel className="form-label-gold">שם פרטי</FormLabel>
                          <FormControl>
                            <Input className="form-input-gold" placeholder="שם פרטי" {...field} value={field.value || ""} />
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
                          <FormLabel className="form-label-gold">שם משפחה</FormLabel>
                          <FormControl>
                            <Input className="form-input-gold" placeholder="שם משפחה" {...field} value={field.value || ""} />
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
                        <FormLabel className="form-label-gold">שם משתמש</FormLabel>
                        <FormControl>
                          <Input className="form-input-gold" placeholder="צור שם משתמש ייחודי" {...field} />
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
                          <Input className="form-input-gold" placeholder="הזן את כתובת הדוא״ל שלך" {...field} />
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
                          <Input className="form-input-gold" type="password" placeholder="צור סיסמה חזקה" {...field} />
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
                        <FormLabel className="form-label-gold">אימות סיסמה</FormLabel>
                        <FormControl>
                          <Input className="form-input-gold" type="password" placeholder="הזן שוב את הסיסמה" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-dark))] text-white shadow-lg shadow-amber-300/40"
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}