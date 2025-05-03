import { useAuth, loginSchema, registerSchema } from "@/hooks/use-auth";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [_, navigate] = useLocation();

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

  if (user && !isLoading) {
    return <Redirect to="/" />;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get("mode");
  const defaultTab = mode === "register" ? "register" : "login";

  return (
    <div className="min-h-screen flex flex-col md:flex-row-reverse bg-black">
      <div className="w-full md:w-1/2 p-10 flex items-center justify-center">
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
                className="px-4 py-2 font-alef"
              >
                התחברות
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="px-4 py-2 font-alef"
              >
                הרשמה
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
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
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
