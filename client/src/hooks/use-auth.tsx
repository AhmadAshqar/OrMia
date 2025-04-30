import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, insertUserSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Omit<User, 'password'>, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Omit<User, 'password'>, Error, RegisterData>;
};

// Extended schema for login form
export const loginSchema = z.object({
  username: z.string().min(3, "שם המשתמש חייב להכיל לפחות 3 תווים"),
  password: z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים"),
});

// Extended schema for registration form
export const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "הסיסמאות אינן תואמות",
    path: ["confirmPassword"],
  });

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn<User | null>({ on401: "returnNull" }),
  });

  const loginMutation = useMutation<Omit<User, 'password'>, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "התחברת בהצלחה",
        description: `ברוך הבא ${user.username}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ההתחברות נכשלה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<Omit<User, 'password'>, Error, RegisterData>({
    mutationFn: async (userData: RegisterData) => {
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userDataWithoutConfirm } = userData;
      const res = await apiRequest("POST", "/api/register", userDataWithoutConfirm);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "נרשמת בהצלחה",
        description: "ברוך הבא למערכת",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ההרשמה נכשלה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "התנתקת בהצלחה",
        description: "להתראות",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "ההתנתקות נכשלה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}