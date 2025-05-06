import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface OrderContactButtonProps {
  orderId: number;
  className?: string;
  variant?: "link" | "dialog";
}

export function OrderContactButton({ 
  orderId, 
  className,
  variant = "link" 
}: OrderContactButtonProps) {
  // Link variant simply navigates to the messages page
  if (variant === "link") {
    return (
      <Button variant="ghost" size="sm" asChild className={className}>
        <Link href={`/messages`} className="flex items-center gap-1">
          <MessageCircle className="h-4 w-4" />
          צור קשר בנוגע להזמנה
        </Link>
      </Button>
    );
  }
  
  // Dialog variant is just the button to be used with DialogTrigger
  return (
    <Button variant="ghost" size="sm" className={`flex items-center gap-1 ${className || ''}`}>
      <MessageCircle className="h-4 w-4" />
      צור קשר בנוגע להזמנה
    </Button>
  );
}

export default OrderContactButton;