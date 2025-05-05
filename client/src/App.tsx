import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import ProductsPage from "@/pages/ProductsPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import CartPage from "@/pages/CartPage";
import CheckoutPage from "@/pages/CheckoutPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import FaqPage from "@/pages/FaqPage";
import AuthPage from "@/pages/auth-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import ProfilePage from "@/pages/ProfilePage";
import FavoritesPage from "@/pages/FavoritesPage";
import MyOrdersPage from "@/pages/MyOrdersPage";
import TermsPage from "@/pages/legal/TermsPage";
import PrivacyPage from "@/pages/legal/PrivacyPage";
import ShippingPage from "@/pages/legal/ShippingPage";
import DisclosurePage from "@/pages/legal/DisclosurePage";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";
import { CartProvider } from "@/components/cart/CartContext";
import { AuthProvider } from "@/hooks/use-auth";
import { useEffect, useRef, lazy, Suspense, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

// Admin pages - lazy loaded
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
const ProductsAdminPage = lazy(() => import("@/pages/admin/ProductsPage"));
const UsersAdminPage = lazy(() => import("@/pages/admin/UsersPage"));
const OrdersAdminPage = lazy(() => import("@/pages/admin/OrdersPage"));
const ShippingAdminPage = lazy(() => import("@/pages/admin/ShippingPage"));

function Router() {
  const [location] = useLocation();
  const prevLocationRef = useRef(location);

  // Scroll to top on route change
  useEffect(() => {
    if (location !== prevLocationRef.current) {
      window.scrollTo(0, 0);
      prevLocationRef.current = location;
    }
  }, [location]);
  
  console.log("Current router location:", location);

  // Since we're having issues with exact path matching, let's use a simpler approach
  // to determine which component to render
  const renderBasedOnPath = () => {
    // Exact path matching for reset-password
    if (location.startsWith("/reset-password")) {
      console.log("Rendering ResetPasswordPage");
      return <ResetPasswordPage />;
    }
    
    // Then handle all other routes
    return (
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/products/:category" component={ProductsPage} />
        <Route path="/product/:id" component={ProductDetailPage} />
        <Route path="/cart" component={CartPage} />
        <ProtectedRoute path="/checkout" component={CheckoutPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/favorites" component={FavoritesPage} />
        <ProtectedRoute path="/orders" component={MyOrdersPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/faq" component={FaqPage} />
        <Route path="/auth" component={AuthPage} />
        
        {/* Legal Pages */}
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/shipping-policy" component={ShippingPage} />
        <Route path="/disclosure" component={DisclosurePage} />
        
        {/* Admin Routes */}
        <AdminRoute path="/admin" component={() => <DashboardPage />} />
        <AdminRoute path="/admin/products" component={() => <ProductsAdminPage />} />
        <AdminRoute path="/admin/orders" component={() => <OrdersAdminPage />} />
        <AdminRoute path="/admin/shipping" component={() => <ShippingAdminPage />} />
        <AdminRoute path="/admin/users" component={() => <UsersAdminPage />} />
        
        <Route component={NotFound} />
      </Switch>
    );
  };

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    }>
      {renderBasedOnPath()}
    </Suspense>
  );
}

// We've removed these components since they have import issues that are difficult to fix
// and we're now using a redirect approach instead

function App() {
  // Check for special query parameters for direct page rendering
  const searchParams = new URLSearchParams(window.location.search);
  const directAuth = searchParams.get('directAuth') === 'true';
  
  // Handle direct authentication page rendering
  if (directAuth) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <AuthPage />
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  }
  
  // Normal app rendering
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
