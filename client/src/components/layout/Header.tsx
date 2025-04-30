import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { useCart } from "@/components/cart/CartContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, ShoppingBag, Menu, X } from "lucide-react";

const Header = () => {
  const { t } = useTranslation();
  const { items } = useCart();
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  // Change header background on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const navLinks = [
    { name: t("home"), path: "/" },
    { name: t("collections"), path: "/products" },
    { name: t("rings"), path: "/products/rings" },
    { name: t("necklaces"), path: "/products/necklaces" },
    { name: t("earrings"), path: "/products/earrings" },
    { name: t("about"), path: "/about" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "bg-white/95 shadow-sm backdrop-blur-sm" : "bg-white"
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-3xl font-serif font-bold text-black">
              <span className="text-primary">לוקס</span>מויסנייט
            </Link>

            <nav className="hidden md:flex gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={cn(
                    "font-medium transition-colors hover:text-primary",
                    location === link.path ? "text-primary" : ""
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
                <button className="hover:text-primary transition-colors">
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
              className="hover:text-primary transition-colors relative"
            >
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-black rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {totalItems}
                </span>
              )}
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <button className="md:hidden hover:text-primary transition-colors">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col min-h-screen">
                <div className="flex justify-between items-center">
                  <Link
                    href="/"
                    className="text-xl font-serif font-bold text-black"
                  >
                    <span className="text-primary">לוקס</span>מויסנייט
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
                        location === link.path ? "text-primary" : ""
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
