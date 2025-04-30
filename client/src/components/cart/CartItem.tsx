import { useTranslation } from "react-i18next";
import { formatPrice } from "@/lib/utils";
import { useCart } from "./CartContext";
import { Product } from "@shared/schema";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartItemProps {
  product: Product;
  quantity: number;
}

const CartItem = ({ product, quantity }: CartItemProps) => {
  const { t } = useTranslation();
  const { updateItemQuantity, removeItem } = useCart();
  const price = product.salePrice || product.price;
  const totalPrice = price * quantity;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 py-4 border-b border-gray-200">
      <div className="w-24 h-24 bg-gray-100 overflow-hidden">
        <img 
          src={product.mainImage} 
          alt={product.name} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex-1">
        <h3 className="font-medium">{product.name}</h3>
        <p className="text-sm text-gray-500">
          {product.categoryName} | SKU: {product.sku}
        </p>
      </div>
      
      <div className="flex items-center justify-center">
        <p className="font-medium text-primary">
          {formatPrice(price)}
        </p>
      </div>
      
      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => updateItemQuantity(product.id, Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
        >
          <MinusIcon className="h-3 w-3" />
        </Button>
        
        <span className="w-10 text-center">{quantity}</span>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => updateItemQuantity(product.id, quantity + 1)}
        >
          <PlusIcon className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="font-medium text-primary">
        {formatPrice(totalPrice)}
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeItem(product.id)}
        title={t("remove")}
      >
        <Trash2Icon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default CartItem;
