import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCart } from "@/components/cart/CartContext";
import { Eye, Heart, Star, StarHalf } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { t } = useTranslation();
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(product, 1);
    toast({
      title: t("add_to_cart"),
      description: `${product.name} ${t("add_to_cart")}`,
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-primary text-primary" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-primary text-primary" />);
    }

    return stars;
  };

  return (
    <div className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 slide-in">
      <div className="relative overflow-hidden group">
        <Link href={`/product/${product.id}`}>
          <img 
            src={product.mainImage} 
            alt={product.name} 
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        
        {product.isNew && (
          <div className="absolute top-2 right-2 bg-primary text-black text-xs py-1 px-2">
            {t("new")}
          </div>
        )}
        
        {product.salePrice && product.salePrice < product.price && (
          <div className="absolute top-2 right-2 bg-destructive text-white text-xs py-1 px-2">
            {t("sale")}
          </div>
        )}
        
        <div className="absolute bottom-0 right-0 p-3 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform">
          <button className="bg-white text-black hover:bg-primary hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors" title={t("add_to_wishlist")}>
            <Heart className="h-4 w-4" />
          </button>
          <Link href={`/product/${product.id}`} className="bg-white text-black hover:bg-primary hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors">
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </div>
      
      <div className="p-4">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-serif text-lg mb-1">{product.name}</h3>
        </Link>
        
        <div className="flex justify-between items-center mb-3">
          <div>
            {product.salePrice ? (
              <>
                <p className="text-primary font-medium">{formatPrice(product.salePrice)}</p>
                <p className="text-gray-400 text-sm line-through">{formatPrice(product.price)}</p>
              </>
            ) : (
              <p className="text-primary font-medium">{formatPrice(product.price)}</p>
            )}
          </div>
          
          <div className="flex text-primary text-xs items-center">
            {renderStars(product.rating)}
            <span className="text-foreground/70 mr-1">({product.reviewCount})</span>
          </div>
        </div>
        
        <Button 
          onClick={handleAddToCart} 
          className="w-full bg-black hover:bg-primary text-white transition-colors"
          disabled={!product.inStock}
        >
          {product.inStock ? t("add_to_cart") : t("out_of_stock")}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
