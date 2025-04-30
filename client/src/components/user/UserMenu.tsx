import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut, Settings, ShoppingBag, Heart, UserCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function UserMenu() {
  const { user, isLoading, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();

  // Handle logout
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    navigate("/");
  };

  // Not logged in - show sign in button
  if (!user && !isLoading) {
    return (
      <Button 
        variant="ghost" 
        className="text-gold-700 hover:bg-gold-50 hover:text-gold-800 gap-1"
        onClick={() => navigate("/auth")}
      >
        <UserCircle className="h-5 w-5 ml-1" />
        <span className="hidden md:inline">התחברות</span>
      </Button>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Button disabled variant="ghost" className="text-gold-700 gap-1">
        <div className="h-5 w-5 rounded-full border-2 border-gold-600 border-t-transparent animate-spin"></div>
        <span className="hidden md:inline">טוען...</span>
      </Button>
    );
  }

  // User is logged in - show menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative text-gold-700 hover:bg-gold-50 hover:text-gold-800 gap-2">
          <Avatar className="h-8 w-8 border border-gold-200">
            <AvatarFallback className="bg-gold-100 text-gold-800">
              {user?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline">
            {user?.firstName || user?.username || "משתמש"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rtl">
        <DropdownMenuLabel className="text-right">החשבון שלי</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex gap-2 cursor-pointer" onClick={() => navigate("/profile")}>
          <User className="h-4 w-4" />
          <span>הפרופיל שלי</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex gap-2 cursor-pointer" onClick={() => navigate("/orders")}>
          <ShoppingBag className="h-4 w-4" />
          <span>ההזמנות שלי</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex gap-2 cursor-pointer" onClick={() => navigate("/wishlist")}>
          <Heart className="h-4 w-4" />
          <span>המועדפים שלי</span>
        </DropdownMenuItem>
        {user?.role === "admin" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex gap-2 cursor-pointer" onClick={() => navigate("/admin")}>
              <Settings className="h-4 w-4" />
              <span>ניהול האתר</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="flex gap-2 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 focus:text-red-600" 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
          <span>{logoutMutation.isPending ? "מתנתק..." : "התנתק"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}