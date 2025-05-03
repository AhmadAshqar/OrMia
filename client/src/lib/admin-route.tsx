import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  if (user.role !== "admin") {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">גישה נדחתה</h1>
          <p className="mb-6 text-muted-foreground">אין לך הרשאות מתאימות לצפייה בעמוד זה.</p>
          <a href="/" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90">
            חזרה לעמוד הבית
          </a>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}