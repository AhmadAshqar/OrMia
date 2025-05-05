import { ReactNode } from "react";
import { useLocation } from "wouter";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();
  
  // Check if the current page needs padding
  const needsPadding = () => {
    return (
      location.includes("/products/") ||  // Products pages (טבעות, שרשראות, עגילים)
      location === "/products/new" ||    // NEW page
      location === "/profile" ||         // Profile page
      location === "/orders" ||          // My orders page
      location === "/favorites"          // Favorites page
    );
  };

  return (
    <>
      <Header />
      <main className={needsPadding() ? "pt-32" : ""}>{children}</main>
      <Footer />
    </>
  );
}