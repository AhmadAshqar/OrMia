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
    <div 
      className="min-h-screen flex flex-col md:flex-row-reverse bg-black" 
      style={{
        backgroundImage: `url('/images/jewelry-background.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Hero section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-black to-gray-900 p-10 flex items-center justify-center">
        <div className="max-w-lg">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-right text-gold-400 text-shadow">
            ברוכים הבאים לעולם המויסנייט
          </h1>
          <p className="text-lg text-right text-gold-300 mb-8">
            הכנס לחשבונך כדי לצפות בהזמנות שלך, לשמור מוצרים ברשימת המשאלות וליהנות מחווית קניה מותאמת אישית.
          </p>
          <div className="flex justify-end">
            <div className="w-28 h-1 bg-gradient-to-r from-gold-300 to-gold-500 rounded-full shadow-md"></div>
          </div>
        </div>
      </div>

      {/* Form section */}
      <div className="w-full md:w-1/2 p-6 md:p-10 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
        <div className="w-full max-w-md space-y-6 rtl bg-black bg-opacity-80 shadow-2xl rounded-xl p-8 border border-gold-500">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-playfair font-bold text-gold-400 mb-3">התחבר לחשבונך</h2>
            <p className="text-gold-300">או צור חשבון חדש כדי להתחיל</p>
            <div className="mt-4 mx-auto w-16 h-1 bg-gradient-to-r from-gold-300 to-gold-500 rounded-full"></div>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full space-y-8">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 p-1 rounded-lg border border-gold-500">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-600 data-[state=active]:to-gold-400 data-[state=active]:text-black data-[state=active]:shadow-gold text-gold-400 transition-all rounded-md py-3 text-base font-semibold"
              >
                התחברות
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-600 data-[state=active]:to-gold-400 data-[state=active]:text-black data-[state=active]:shadow-gold text-gold-400 transition-all rounded-md py-3 text-base font-semibold"
              >
                הרשמה
              </TabsTrigger>
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
                        <FormLabel className="text-gold-300">שם משתמש</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="הזן את שם המשתמש שלך" 
                            className="bg-gray-900 border-gold-500 focus:border-gold-300 rounded-md p-3 text-gold-200 placeholder:text-gray-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-amber-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="text-gold-300">סיסמה</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="הזן את הסיסמה שלך" 
                            className="bg-gray-900 border-gold-500 focus:border-gold-300 rounded-md p-3 text-gold-200 placeholder:text-gray-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-amber-500" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full mt-6 bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-dark))] text-white text-lg py-6 font-semibold shadow-md rounded-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <span>מתחבר...</span>
                      </div>
                    ) : (
                      "התחבר לחשבון"
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
                          <FormLabel className="text-gold-300">שם פרטי</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="שם פרטי" 
                              className="bg-gray-900 border-gold-500 focus:border-gold-300 rounded-md p-3 text-gold-200 placeholder:text-gray-500"
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormMessage className="text-amber-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="text-right">
                          <FormLabel className="text-gold-300">שם משפחה</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="שם משפחה" 
                              className="bg-gray-900 border-gold-500 focus:border-gold-300 rounded-md p-3 text-gold-200 placeholder:text-gray-500"
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormMessage className="text-amber-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="text-gold-300">שם משתמש</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="צור שם משתמש ייחודי" 
                            className="bg-gray-900 border-gold-500 focus:border-gold-300 rounded-md p-3 text-gold-200 placeholder:text-gray-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-amber-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="text-gold-300">דוא"ל</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="הזן את כתובת הדוא״ל שלך" 
                            className="bg-gray-900 border-gold-500 focus:border-gold-300 rounded-md p-3 text-gold-200 placeholder:text-gray-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-amber-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="text-gold-300">סיסמה</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="צור סיסמה חזקה" 
                            className="bg-gray-900 border-gold-500 focus:border-gold-300 rounded-md p-3 text-gold-200 placeholder:text-gray-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-amber-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="text-gold-300">אימות סיסמה</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="הזן שוב את הסיסמה" 
                            className="bg-gray-900 border-gold-500 focus:border-gold-300 rounded-md p-3 text-gold-200 placeholder:text-gray-500"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-amber-500" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full mt-6 bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-dark))] text-white text-lg py-6 font-semibold shadow-md rounded-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <span>יוצר חשבון...</span>
                      </div>
                    ) : (
                      "צור חשבון חדש"
                    )}
                  </Button>
                  
                  <div className="text-center mt-4 text-sm text-gray-600">
                    בהרשמה אתה מסכים ל<a href="/terms" className="text-gold-600 hover:underline">תנאי השימוש</a> ול<a href="/privacy" className="text-gold-600 hover:underline">מדיניות הפרטיות</a> שלנו
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}