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
      className="min-h-screen flex flex-col md:flex-row-reverse bg-black overflow-hidden relative" 
      style={{
        backgroundImage: `linear-gradient(to bottom, #000000, #111111)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Decorative floating gold elements */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-gradient-to-br from-gold-600 to-gold-300 opacity-15 blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 opacity-15 blur-3xl"></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-black to-gold-800 opacity-20 blur-3xl"></div>
      {/* Hero section */}
      <div className="w-full md:w-1/2 p-10 flex items-center justify-center bg-black relative overflow-hidden">
        {/* Diamond sparkle effect */}
        <div className="absolute top-20 right-10 w-20 h-20 rotate-45 bg-gold-400 opacity-10 animate-pulse"></div>
        <div className="absolute bottom-40 left-20 w-12 h-12 rotate-45 bg-gold-500 opacity-10 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-40 left-10 w-8 h-8 rotate-45 bg-gradient-to-br from-gold-300 to-gold-600 opacity-15 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="max-w-lg relative z-10">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-6 text-right text-transparent bg-clip-text bg-gradient-to-r from-gold-300 to-gold-600" style={{ textShadow: '0 2px 10px rgba(234, 179, 8, 0.5)' }}>
            ברוכים הבאים לעולם המויסנייט
          </h1>
          <p className="text-lg text-right text-gold-300 mb-8 leading-relaxed">
            הכנס לחשבונך כדי לצפות בהזמנות שלך, לשמור מוצרים ברשימת המשאלות וליהנות מחווית קניה מותאמת אישית עם התכשיטים היפים ביותר.
          </p>
          <div className="flex justify-end">
            <div className="w-28 h-1 bg-gradient-to-r from-gold-300 to-gold-500 rounded-full shadow-md" style={{ boxShadow: '0 0 20px rgba(234, 179, 8, 0.7)' }}></div>
          </div>
        </div>
      </div>

      {/* Form section */}
      <div className="w-full md:w-1/2 p-6 md:p-10 flex items-center justify-center bg-black relative z-10">
        <div className="w-full max-w-md space-y-6 rtl bg-white shadow-2xl rounded-xl p-8 border-2 border-gold-500" style={{ boxShadow: '0 0 25px rgba(234, 179, 8, 0.5), 0 10px 40px -10px rgba(0, 0, 0, 0.8)' }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-playfair font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-600 to-gold-400 mb-3">התחבר לחשבונך</h2>
            <p className="text-gray-700">או צור חשבון חדש כדי להתחיל</p>
            <div className="mt-4 mx-auto w-16 h-1 bg-gradient-to-r from-gold-400 to-gold-600 rounded-full shadow-md"></div>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full space-y-8">
            <TabsList className="grid w-full grid-cols-2 bg-gradient-to-br from-black to-gray-900 p-1 rounded-lg border border-gold-500 shadow-inner overflow-hidden">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-600 data-[state=active]:to-gold-400 data-[state=active]:text-black data-[state=active]:shadow-gold data-[state=active]:shadow-md data-[state=active]:font-bold text-gray-300 transition-all duration-300 rounded-md py-3 text-base font-semibold z-10"
              >
                התחברות
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gold-600 data-[state=active]:to-gold-400 data-[state=active]:text-black data-[state=active]:shadow-gold data-[state=active]:shadow-md data-[state=active]:font-bold text-gray-300 transition-all duration-300 rounded-md py-3 text-base font-semibold z-10"
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
                        <FormLabel className="text-gray-700 font-medium">שם משתמש</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="הזן את שם המשתמש שלך" 
                            className="bg-white border-gray-300 focus:border-gold-500 rounded-md p-3 text-black placeholder:text-gray-400" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="text-gray-700 font-medium">סיסמה</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="הזן את הסיסמה שלך" 
                            className="bg-white border-gray-300 focus:border-gold-500 rounded-md p-3 text-black placeholder:text-gray-400" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full mt-6 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black text-lg py-6 font-semibold shadow-md rounded-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-gold-300"
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
                          <FormLabel className="text-gray-700 font-medium">שם פרטי</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="שם פרטי" 
                              className="bg-white border-gray-300 focus:border-gold-500 rounded-md p-3 text-black placeholder:text-gray-400"
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="text-right">
                          <FormLabel className="text-gray-700 font-medium">שם משפחה</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="שם משפחה" 
                              className="bg-white border-gray-300 focus:border-gold-500 rounded-md p-3 text-black placeholder:text-gray-400"
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="text-gray-700 font-medium">שם משתמש</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="צור שם משתמש ייחודי" 
                            className="bg-white border-gray-300 focus:border-gold-500 rounded-md p-3 text-black placeholder:text-gray-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="text-gray-700 font-medium">דוא"ל</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="הזן את כתובת הדוא״ל שלך" 
                            className="bg-white border-gray-300 focus:border-gold-500 rounded-md p-3 text-black placeholder:text-gray-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="text-gray-700 font-medium">סיסמה</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="צור סיסמה חזקה" 
                            className="bg-white border-gray-300 focus:border-gold-500 rounded-md p-3 text-black placeholder:text-gray-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem className="text-right">
                        <FormLabel className="text-gray-700 font-medium">אימות סיסמה</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="הזן שוב את הסיסמה" 
                            className="bg-white border-gray-300 focus:border-gold-500 rounded-md p-3 text-black placeholder:text-gray-400"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full mt-6 bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black text-lg py-6 font-semibold shadow-md rounded-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-gold-300"
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
                    בהרשמה אתה מסכים ל<a href="/terms" className="text-gold-600 hover:text-gold-700 hover:underline transition-colors font-medium">תנאי השימוש</a> ול<a href="/privacy" className="text-gold-600 hover:text-gold-700 hover:underline transition-colors font-medium">מדיניות הפרטיות</a> שלנו
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