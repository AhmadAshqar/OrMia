import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye, Star, StarHalf } from "lucide-react";
import { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { toast } = useToast();

  const handleAddToCart = async () => {
    try {
      await apiRequest('POST', '/api/cart', { productId: product.id, quantity: 1 });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: "נוסף לסל הקניות",
        description: `${product.name} נוסף לסל הקניות בהצלחה.`,
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת המוצר לסל הקניות.",
        variant: "destructive",
      });
    }
  };

  const handleAddToWishlist = async (e?: React.MouseEvent) => {
    // Prevent the event from bubbling up (important!)
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("ProductCard - handleAddToWishlist called for product:", product.id);
    
    try {
      console.log("Adding to favorites, product ID:", product.id);
      const response = await apiRequest('POST', '/api/favorites', { productId: Number(product.id) });
      console.log("Favorites API response:", response);
      
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "נוסף למועדפים",
        description: `${product.name} נוסף למועדפים בהצלחה.`,
      });
    } catch (error: any) {
      console.error("Error adding to favorites:", error);
      
      if (error.status === 401) {
        toast({
          title: "שגיאה",
          description: "יש להתחבר תחילה כדי להוסיף מוצרים למועדפים.",
          variant: "destructive",
        });
      } else if (error.status === 409) {
        toast({
          title: "מוצר כבר נמצא במועדפים",
          description: `${product.name} כבר נמצא במועדפים שלך.`,
        });
      } else {
        toast({
          title: "שגיאה",
          description: "אירעה שגיאה בהוספת המוצר למועדפים.",
          variant: "destructive",
        });
      }
    }
  };

  const handleQuickView = () => {
    toast({
      title: "תצוגה מהירה",
      description: `תצוגה מהירה של ${product.name} זמינה בקרוב.`,
    });
  };

  // Render star ratings
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" size={14} />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" size={14} />);
    }

    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-300" size={14} />);
    }

    return stars;
  };

  return (
    <Card 
      className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 slide-in overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative overflow-hidden group">
        <Link href={`/product/${product.id}`}>
          <img 
            src={product.mainImage || (product.images ? product.images.split(',')[0] : '')} 
            alt={product.name} 
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        
        {/* If product is both new and on sale, show badges in different positions */}
        {product.isNew && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold py-1 px-3 rounded-full shadow-md transform rotate-[-5deg]">
            חדש
          </div>
        )}
        
        {product.salePrice && product.salePrice < product.price && (
          <div className="absolute top-2 left-2 bg-[hsl(var(--burgundy))] text-white text-xs font-bold py-1 px-3 rounded-full shadow-md transform rotate-[-5deg]">
            מבצע
          </div>
        )}
        
        <div 
          className={`absolute bottom-0 right-0 p-3 flex gap-2 transition-transform duration-300 ${
            isHovering ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <Button 
            size="icon" 
            variant="secondary" 
            className="bg-white text-black hover:bg-[hsl(var(--gold))] hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            onClick={handleAddToWishlist}
          >
            <Heart size={14} />
          </Button>
          <Button 
            size="icon" 
            variant="secondary" 
            className="bg-white text-black hover:bg-[hsl(var(--gold))] hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            onClick={handleQuickView}
          >
            <Eye size={14} />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-serif text-lg mb-1">{product.name}</h3>
        <div className="flex justify-between items-center mb-3">
          <div>
            {product.salePrice ? (
              <>
                <p className="text-[hsl(var(--gold))] font-medium">₪{product.salePrice.toLocaleString()}</p>
                <p className="text-gray-400 text-sm line-through">₪{product.price.toLocaleString()}</p>
              </>
            ) : (
              <p className="text-[hsl(var(--gold))] font-medium">₪{product.price.toLocaleString()}</p>
            )}
          </div>
          <div className="flex items-center">
            <div className="flex text-[hsl(var(--gold))] text-xs">
              {renderStars(product.rating)}
            </div>
            <span className="text-gray-500 mr-1 text-xs">({product.reviewCount})</span>
          </div>
        </div>
        <Button 
          className="w-full py-2 bg-black hover:bg-[hsl(var(--gold))] text-white transition-colors font-medium"
          onClick={handleAddToCart}
        >
          הוסף לסל
        </Button>
      </CardContent>
    </Card>
  );
}
