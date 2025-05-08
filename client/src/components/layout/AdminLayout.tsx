import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  BarChart3,
  ShoppingBag,
  MessageSquare,
  Settings,
  Users,
  Menu,
  LogOut,
  ChevronLeft,
  ShoppingCart,
  Truck,
  Tag,
  Ticket
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children, title }: AdminLayoutProps & { title?: string }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const routes = [
    {
      title: "לוח בקרה",
      href: "/admin",
      icon: <BarChart3 className="ml-2 h-5 w-5" />,
    },
    {
      title: "מוצרים",
      href: "/admin/products",
      icon: <ShoppingBag className="ml-2 h-5 w-5" />,
    },
    {
      title: "ניהול הזמנות",
      href: "/admin/orders",
      icon: <ShoppingCart className="ml-2 h-5 w-5" />,
    },
    {
      title: "ניהול משלוחים",
      href: "/admin/shipping",
      icon: <Truck className="ml-2 h-5 w-5" />,
    },
    {
      title: "קודי קופון",
      href: "/admin/promo-codes",
      icon: <Ticket className="ml-2 h-5 w-5" />,
    },
    {
      title: "משתמשים",
      href: "/admin/users",
      icon: <Users className="ml-2 h-5 w-5" />,
    },
    {
      title: "הודעות",
      href: "/admin/messages",
      icon: <MessageSquare className="ml-2 h-5 w-5" />,
    },
    {
      title: "פניות",
      href: "/admin/contact",
      icon: <MessageSquare className="ml-2 h-5 w-5" />,
    },
    {
      title: "הגדרות",
      href: "/admin/settings",
      icon: <Settings className="ml-2 h-5 w-5" />,
    },
  ];
  
  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col p-0">
            <div className="p-6">
              <Link 
                href="/" 
                className="flex items-center gap-2 font-semibold"
                onClick={() => setOpen(false)}
              >
                <ChevronLeft className="h-5 w-5" />
                <span>חזרה לחנות</span>
              </Link>
            </div>
            <nav className="grid gap-2 px-2">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    location === route.href && "bg-primary/10 text-primary"
                  )}
                >
                  {route.icon}
                  <span>{route.title}</span>
                </Link>
              ))}
              <Separator className="my-2" />
              <Button 
                variant="ghost" 
                className="flex justify-start px-3" 
                onClick={handleLogout}
              >
                <LogOut className="ml-2 h-5 w-5" />
                <span>התנתקות</span>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex-1">
          <h1 className="text-xl font-bold">אזור ניהול</h1>
        </div>
      </header>
      
      <div className="grid md:grid-cols-[240px_1fr]">
        {/* Sidebar (desktop only) */}
        <aside className="hidden border-l bg-background md:block">
          <div className="sticky top-0 flex flex-col gap-2 p-4">
            <div className="flex h-16 items-center px-4 font-bold text-xl">
              <Link href="/" className="flex items-center gap-2 text-primary">
                <ChevronLeft className="h-5 w-5" />
                <span>חזרה לחנות</span>
              </Link>
            </div>
            <nav className="grid gap-2 px-2 text-lg">
              {routes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    location === route.href && "bg-primary/10 text-primary"
                  )}
                >
                  {route.icon}
                  <span>{route.title}</span>
                </Link>
              ))}
              <Separator className="my-4" />
              <div className="px-3 py-2">
                <div className="mb-2 text-sm text-muted-foreground">
                  מחובר כ
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-1">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {user?.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{user?.username}</div>
                </div>
                <Button 
                  variant="ghost" 
                  className="mt-4 w-full justify-start px-2" 
                  onClick={handleLogout}
                >
                  <LogOut className="ml-2 h-5 w-5" />
                  <span>התנתקות</span>
                </Button>
              </div>
            </nav>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8">
          {title && <h1 className="text-2xl font-bold mb-6">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}