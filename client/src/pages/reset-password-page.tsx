import { useState, useEffect } from "react";
import { Redirect, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Schema for the reset password form
const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { message: "נדרש טוקן איפוס" }),
    password: z
      .string()
      .min(8, { message: "הסיסמה חייבת להכיל לפחות 8 תווים" }),
    confirmPassword: z.string().min(1, { message: "יש לאשר את הסיסמה" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "הסיסמאות אינן תואמות",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  console.log("ResetPasswordPage component rendered");
  const { user, isLoading, resetPasswordMutation } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [isFormReady, setIsFormReady] = useState(false);
  
  // Initialize the reset password form
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Get token from URL query params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    let tokenParam = searchParams.get("token") || searchParams.get("reset_token");
    
    console.log("Reset token page - URL search params:", window.location.search);
    console.log("Reset token page - Token detected:", tokenParam);
    
    if (tokenParam) {
      setToken(tokenParam);
      resetPasswordForm.setValue("token", tokenParam);
      setIsFormReady(true);
    } else {
      // No token in search params? Check if it's in the root App component state 
      // (when we use reset_token in the root path)
      const urlParams = new URLSearchParams(window.location.search);
      tokenParam = urlParams.get("reset_token");
      
      if (tokenParam) {
        console.log("Found token in URL params:", tokenParam);
        setToken(tokenParam);
        resetPasswordForm.setValue("token", tokenParam);
        setIsFormReady(true);
      } else {
        // No token anywhere? Redirect to auth page
        toast({
          title: "שגיאה",
          description: "לא נמצא טוקן איפוס תקף",
          variant: "destructive",
        });
        setTimeout(() => navigate("/auth"), 2000);
      }
    }
  }, [resetPasswordForm, navigate, toast]);

  async function onResetPasswordSubmit(values: z.infer<typeof resetPasswordSchema>) {
    try {
      console.log("Submitting reset password form with values:", values);
      await resetPasswordMutation.mutateAsync(values);
      toast({
        title: "הצלחה",
        description: "הסיסמה אופסה בהצלחה",
      });
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error) {
      console.error("Password reset failed:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה באיפוס הסיסמה",
        variant: "destructive",
      });
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
              איפוס סיסמה
            </h1>
            <p className="text-lg text-right text-amber-300 mb-8 font-alef leading-relaxed">
              יש להזין סיסמה חדשה לחשבון שלך. הסיסמה חייבת להיות באורך של 8 תווים לפחות.
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
                הגדרת סיסמה חדשה
              </h2>
              <p className="text-amber-900 font-alef">
                יש להזין את הסיסמה החדשה פעמיים
              </p>
              <div className="h-0.5 w-24 mx-auto mt-4 bg-gradient-to-r from-transparent via-black to-transparent"></div>
            </div>

            {!isFormReady || !token ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-amber-800" />
              </div>
            ) : (
              <Form {...resetPasswordForm}>
                <form
                  onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)}
                  className="space-y-4"
                >
                  <input
                    type="hidden"
                    {...resetPasswordForm.register("token")}
                  />
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
                  <Button
                    type="submit"
                    className="w-full btn-luxury shadow-lg shadow-black/40 py-6 text-lg mt-6"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        מעבד...
                      </div>
                    ) : (
                      "שמור סיסמה חדשה"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}