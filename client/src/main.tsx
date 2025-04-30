import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import { CartProvider } from "./components/cart/CartContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { StrictMode } from "react";

// Make sure the CartProvider is accessible to all components that use it
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <App />
        </CartProvider>
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>
);
