import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { CartProvider } from "@/components/cart/CartContext";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <CartProvider>
      <Header />
      <main>{children}</main>
      <Footer />
    </CartProvider>
  );
}