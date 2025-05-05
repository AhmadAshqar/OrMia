import { useState, useEffect, useContext, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { CartContext } from "@/components/cart/CartContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, ShoppingBag, Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const Header = () => {
  const { t } = useTranslation();
  const { user, logoutMutation } = useAuth();
  const cartContext = useContext(CartContext);
  const items = cartContext?.items || [];
  const [location, navigate] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  // Change header background on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Safely calculate total items
  const totalItems = items.length > 0 
    ? items.reduce((total, item) => total + (item.quantity || 0), 0)
    : 0;

  const navLinks = [
    { name: "דף הבית", path: "/" },
    { name: "NEW", path: "/products/new", isHighlighted: true },
    { name: "טבעות", path: "/products/טבעות" },
    { name: "שרשראות", path: "/products/שרשראות" },
    { name: "עגילים", path: "/products/עגילים" },
    { name: "צמידים", path: "/products/צמידים" },
    { name: "אודות", path: "/about" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500",
        isScrolled 
          ? "bg-gradient-to-b from-black/70 to-black/0 backdrop-blur-sm py-2" 
          : "bg-gradient-to-b from-black/40 to-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <img src="/ormia-gold-logo.png" alt="אור מיה תכשיטים" className="h-14 p-1" />
            </Link>

            <nav className="hidden md:flex gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={cn(
                    "font-medium transition-colors text-white hover:text-primary",
                    location === link.path ? "text-primary" : "",
                    link.isHighlighted ? "font-bold text-[#FFD700]" : ""
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-white hover:text-primary transition-colors">
                  <Search className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="flex">
                  <input
                    type="text"
                    placeholder={t("search")}
                    className="flex-1 border-0 focus:ring-0 outline-none"
                  />
                  <button className="bg-primary text-black px-4 py-2">
                    {t("search")}
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            <Link
              href="/cart"
              className="text-white hover:text-primary transition-colors relative"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {totalItems}
                </span>
              )}
            </Link>
            
            {/* User profile icon - Shows dropdown when logged in, otherwise links to auth */}
            {user ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-white hover:text-primary transition-colors relative cursor-pointer">
                    <User className="h-5 w-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 rtl">
                  <div className="flex flex-col space-y-1 p-2">
                    <div className="text-sm font-medium">
                      {user.firstName || user.username || "שלום"}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      {user.email}
                    </div>
                    <Link href="/profile" className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                      הפרופיל שלי
                    </Link>
                    <Link href="/orders" className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                      ההזמנות שלי
                    </Link>
                    <Link href="/favorites" className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                      המועדפים שלי
                    </Link>
                    {user.role === "admin" && (
                      <Link href="/admin" className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                        ניהול האתר
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button 
                      onClick={async () => {
                        try {
                          await logoutMutation.mutateAsync();
                          navigate("/");
                        } catch (error) {
                          console.error("Logout failed:", error);
                        }
                      }}
                      disabled={logoutMutation.isPending}
                      className="flex items-center p-2 text-red-500 hover:bg-red-50 rounded-md cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 ml-2" />
                      {logoutMutation.isPending ? "מתנתק..." : "התנתק"}
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Link
                href="/auth"
                className="text-white hover:text-primary transition-colors relative cursor-pointer"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <button className="md:hidden text-white hover:text-primary transition-colors">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col min-h-screen">
                <div className="flex justify-between items-center">
                  <Link href="/" className="flex items-center">
                    <img src="/ormia-gold-logo.png" alt="אור מיה תכשיטים" className="h-12 p-1" />
                  </Link>
                  <SheetTrigger asChild>
                    <button className="hover:text-primary transition-colors">
                      <X className="h-5 w-5" />
                    </button>
                  </SheetTrigger>
                </div>
                <nav className="flex flex-col gap-6 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={cn(
                        "font-medium text-lg transition-colors hover:text-primary",
                        location === link.path ? "text-primary" : "",
                        link.isHighlighted ? "font-bold text-[#FFD700]" : ""
                      )}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <Link
                    href="/contact"
                    className="font-medium text-lg transition-colors hover:text-primary"
                  >
                    {t("contact")}
                  </Link>
                  <Link
                    href="/faq"
                    className="font-medium text-lg transition-colors hover:text-primary"
                  >
                    {t("faq")}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
