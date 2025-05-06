import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface OrderContactButtonProps {
  orderId: number;
  className?: string;
}

// Simplified to just be a link to the messages page
export function OrderContactButton({ orderId, className }: OrderContactButtonProps) {
  return (
    <Button variant="ghost" size="sm" asChild className={className}>
      <Link href={`/messages`} className="flex items-center gap-1">
        <MessageCircle className="h-4 w-4" />
        צור קשר בנוגע להזמנה
      </Link>
    </Button>
  );
}

export default OrderContactButton;