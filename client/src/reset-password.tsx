import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/components/cart/CartContext";
import ResetPasswordPage from "@/pages/reset-password-page";

import "./index.css";

const container = document.getElementById("reset-root");
if (!container) {
  throw new Error("Cannot find reset-root element");
}

const root = createRoot(container);

// Render the reset password UI
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <ResetPasswordPage />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);