import { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard,
  Box,
  ShoppingBag,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const mainNavItems = [
    {
      title: "לוח בקרה",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5 ml-3" />
    },
    {
      title: "מוצרים",
      href: "/admin/products",
      icon: <Box className="h-5 w-5 ml-3" />
    },
    {
      title: "מלאי",
      href: "/admin/inventory",
      icon: <ShoppingBag className="h-5 w-5 ml-3" />
    },
    {
      title: "משתמשים",
      href: "/admin/users",
      icon: <Users className="h-5 w-5 ml-3" />
    },
    {
      title: "פניות",
      href: "/admin/messages",
      icon: <MessageSquare className="h-5 w-5 ml-3" />
    },
    {
      title: "הגדרות",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5 ml-3" />
    }
  ];

  return (
    <div className="flex h-screen bg-muted/20 rtl">
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden md:flex flex-col fixed h-full bg-black text-white z-20 shadow-xl transition-all duration-300",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/admin" className={cn(
            "text-lg font-semibold flex items-center",
            !isSidebarOpen && "justify-center"
          )}>
            {isSidebarOpen ? (
              <div className="flex items-center">
                <span className="text-gold-gradient">ניהול</span>
                <span className="text-white mr-1">מויסנייט</span>
              </div>
            ) : (
              <span className="text-primary font-bold text-xl">מ</span>
            )}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white hover:bg-white/10"
          >
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              isSidebarOpen ? "rotate-0" : "rotate-90"
            )} />
          </Button>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-3 text-white rounded-md transition-colors",
                  location === item.href 
                    ? "bg-gold-gradient text-black font-medium shadow-md" 
                    : "hover:bg-white/10"
                )}
              >
                {item.icon}
                {isSidebarOpen && <span>{item.title}</span>}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center px-3 py-3 text-white rounded-md hover:bg-white/10 w-full"
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5 ml-3" />
            {isSidebarOpen && (
              <span>{logoutMutation.isPending ? "מתנתק..." : "התנתק"}</span>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-black text-white z-20 shadow-xl">
        <div className="flex items-center justify-between p-4">
          <Link href="/admin" className="text-lg font-semibold">
            <span className="text-gold-gradient">ניהול</span>
            <span className="text-white mr-1">מויסנייט</span>
          </Link>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-black border-l border-white/10 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <Link href="/admin" className="text-lg font-semibold">
                    <span className="text-gold-gradient">ניהול</span>
                    <span className="text-white mr-1">מויסנייט</span>
                  </Link>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                      <X className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                </div>
                
                <div className="flex-1 overflow-y-auto py-4">
                  <nav className="space-y-1 px-2">
                    {mainNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center px-3 py-3 text-white rounded-md transition-colors",
                          location === item.href 
                            ? "bg-gold-gradient text-black font-medium shadow-md" 
                            : "hover:bg-white/10"
                        )}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
                
                <div className="p-4 border-t border-white/10">
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-3 text-white rounded-md hover:bg-white/10 w-full"
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-5 w-5 ml-3" />
                    <span>{logoutMutation.isPending ? "מתנתק..." : "התנתק"}</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Main Content */}
      <div 
        className={cn(
          "flex-1 transition-all duration-300 overflow-auto",
          isSidebarOpen ? "md:ml-64" : "md:ml-20",
          "mt-16 md:mt-0" // Add top margin for mobile header
        )}
      >
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}