import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Search, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NavLink {
  title: string;
  href: string;
}

const navLinks: NavLink[] = [
  { title: "דף הבית", href: "/" },
  { title: "קולקציות", href: "/category/all" },
  { title: "טבעות", href: "/category/rings" },
  { title: "שרשראות", href: "/category/necklaces" },
  { title: "עגילים", href: "/category/earrings" },
  { title: "אודות", href: "/about" },
];

export default function Header() {
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Get cart items count
  const { data: cartItems } = useQuery<any[]>({
    queryKey: ['/api/cart'],
  });

  const cartItemCount = cartItems?.length || 0;

  return (
    <header>
      {/* Top notification bar */}
      <div className="bg-[hsl(var(--black))] text-white py-2 px-4 text-sm flex justify-between items-center">
        <div>
          <span>משלוח חינם בהזמנות מעל ₪1,000</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[hsl(var(--gold))] transition-colors">התחברות</a>
          <a href="#" className="hover:text-[hsl(var(--gold))] transition-colors">יצירת חשבון</a>
          <a href="/faq" className="hover:text-[hsl(var(--gold))] transition-colors">עזרה</a>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-3xl font-serif font-bold text-black">
                <span className="text-[hsl(var(--gold))]">לוקס</span>מויסנייט
              </Link>
              
              <nav className="hidden md:flex gap-8">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={`font-medium hover:text-[hsl(var(--gold))] transition-colors ${
                      location === link.href ? "text-[hsl(var(--gold))]" : ""
                    }`}
                  >
                    {link.title}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center gap-6">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setSearchOpen(true)}
                className="hover:text-[hsl(var(--gold))] transition-colors"
              >
                <Search className="h-5 w-5" />
              </Button>
              
              <Link href="/cart" className="hover:text-[hsl(var(--gold))] transition-colors relative">
                <ShoppingBag className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-[hsl(var(--gold))] text-black h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Link>
              
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden hover:text-[hsl(var(--gold))] transition-colors"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <nav className="flex flex-col gap-4 mt-8">
                    {navLinks.map((link) => (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        className={`text-xl py-2 border-b border-gray-100 ${
                          location === link.href ? "text-[hsl(var(--gold))]" : ""
                        }`}
                        onClick={() => setMenuOpen(false)}
                      >
                        {link.title}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Search overlay (simplified implementation) */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSearchOpen(false)}>
          <div className="bg-white w-full max-w-2xl p-6 rounded-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center border-b border-gray-300 pb-2">
              <Search className="h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="חפש מוצרים..." 
                className="w-full px-4 py-2 outline-none text-right" 
                autoFocus
              />
              <button 
                onClick={() => setSearchOpen(false)}
                className="text-gray-500 hover:text-[hsl(var(--gold))]"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
