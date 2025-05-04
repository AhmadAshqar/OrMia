import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
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
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";
import { CartProvider } from "@/components/cart/CartContext";
import { AuthProvider } from "@/hooks/use-auth";
import { useEffect, useRef, lazy, Suspense } from "react";
import { useLocation } from "wouter";

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

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    }>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/products" component={ProductsPage} />
        <Route path="/products/:category" component={ProductsPage} />
        <Route path="/product/:id" component={ProductDetailPage} />
        <Route path="/cart" component={CartPage} />
        <ProtectedRoute path="/checkout" component={CheckoutPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/faq" component={FaqPage} />
        <Route path="/auth" component={AuthPage} />
        
        {/* Admin Routes */}
        <AdminRoute path="/admin" component={() => <DashboardPage />} />
        <AdminRoute path="/admin/products" component={() => <ProductsAdminPage />} />
        <AdminRoute path="/admin/orders" component={() => <OrdersAdminPage />} />
        <AdminRoute path="/admin/shipping" component={() => <ShippingAdminPage />} />
        <AdminRoute path="/admin/users" component={() => <UsersAdminPage />} />
        
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  // Use URLSearchParams to check for a direct auth request in case routing isn't working
  const searchParams = new URLSearchParams(window.location.search);
  const directAuth = searchParams.get('directAuth') === 'true';
  
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
