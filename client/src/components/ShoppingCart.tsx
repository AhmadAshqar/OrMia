import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function ShoppingCart() {
  const { data: cartItems, isLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
  });
  
  const { toast } = useToast();
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItem(itemId);
    
    try {
      await apiRequest('PATCH', `/api/cart/${itemId}`, { quantity: newQuantity });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעדכון הכמות",
        variant: "destructive",
      });
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await apiRequest('DELETE', `/api/cart/${itemId}`, {});
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "המוצר הוסר",
        description: "המוצר הוסר מסל הקניות בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהסרת המוצר",
        variant: "destructive",
      });
    }
  };

  const calculateTotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((sum, item) => {
      return sum + (item.product.discountPrice || item.product.price) * item.quantity;
    }, 0);
  };

  const calculateSubtotal = (item: CartItem) => {
    return (item.product.discountPrice || item.product.price) * item.quantity;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-serif mb-6">סל הקניות שלך</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 border-b pb-4">
              <Skeleton className="h-24 w-24" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-8 w-28" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="p-8 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-2xl font-serif mb-2">סל הקניות שלך ריק</h2>
        <p className="text-gray-500 mb-6">נראה שעדיין לא הוספת מוצרים לסל הקניות שלך.</p>
        <Button asChild>
          <Link href="/category/all">המשך בקנייה</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif">סל הקניות שלך</h2>
      
      <div className="border-t border-gray-200">
        {cartItems.map((item) => (
          <div 
            key={item.id} 
            className="flex flex-col sm:flex-row items-start sm:items-center py-6 border-b border-gray-200 gap-4"
          >
            <div className="w-full sm:w-24 h-24 bg-gray-100">
              <img 
                src={item.product.images[0]} 
                alt={item.product.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <h3 className="font-medium">{item.product.name}</h3>
              <p className="text-[hsl(var(--gold))]">
                ₪{(item.product.discountPrice || item.product.price).toLocaleString()}
              </p>
              
              <div className="flex items-center mt-3 border border-gray-300 w-fit">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none" 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={updatingItem === item.id}
                >
                  <Minus size={16} />
                </Button>
                <span className="px-4">{item.quantity}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-none" 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={updatingItem === item.id}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-gray-500 hover:text-red-500" 
                onClick={() => removeItem(item.id)}
              >
                <X size={16} />
              </Button>
              <p className="font-medium">
                ₪{calculateSubtotal(item).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-gray-50 p-6">
        <div className="flex justify-between mb-4">
          <span>סה"כ חלקי:</span>
          <span className="font-medium">₪{calculateTotal().toLocaleString()}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span>משלוח:</span>
          <span>
            {calculateTotal() >= 1000 ? (
              <span className="text-[hsl(var(--gold))]">חינם</span>
            ) : (
              <span>₪50.00</span>
            )}
          </span>
        </div>
        <div className="flex justify-between font-semibold text-lg border-t border-gray-300 pt-4">
          <span>סך הכל:</span>
          <span>
            ₪{(calculateTotal() + (calculateTotal() >= 1000 ? 0 : 50)).toLocaleString()}
          </span>
        </div>
        
        <div className="mt-6 space-y-3">
          <Button asChild className="w-full bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-dark))] text-black">
            <Link href="/checkout">מעבר לתשלום</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/category/all">המשך בקנייה</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
