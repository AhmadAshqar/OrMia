import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, ShoppingCart, Loader2 } from "lucide-react";
import { Link } from "wouter";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/components/cart/CartContext";
import { formatPrice } from "@/lib/utils";
import { Product } from "@shared/schema";

// Type for favorite with product data
type Favorite = {
  id: number;
  userId: number;
  productId: number;
  createdAt: Date;
  product: Product;
};

export default function FavoritesPage() {
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Fetch favorites
  const { data: favorites, isLoading, error } = useQuery({
    queryKey: ["/api/favorites"],
    onError: (error: Error) => {
      toast({
        title: "שגיאה בטעינת מוצרים מועדפים",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove from favorites mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (productId: number) => {
      await apiRequest("DELETE", `/api/favorites/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        description: "המוצר הוסר מהמועדפים",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בהסרת מוצר מהמועדפים",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add to cart handler
  const handleAddToCart = (product: Product) => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.mainImage,
      quantity: 1,
    });

    toast({
      description: "המוצר נוסף לסל הקניות",
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10">
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto py-10">
          <div className="text-center min-h-[50vh] flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">
              שגיאה בטעינת המועדפים
            </h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-10 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-l from-amber-200 to-amber-600 bg-clip-text text-transparent">
            המוצרים המועדפים שלי
          </h1>
          <p className="text-muted-foreground mt-2">
            שמרת {favorites?.length || 0} מוצרים למועדפים
          </p>
        </div>

        {!favorites || favorites.length === 0 ? (
          <div className="text-center min-h-[30vh] flex flex-col items-center justify-center">
            <h2 className="text-xl font-medium mb-4">אין לך מוצרים במועדפים</h2>
            <p className="text-muted-foreground mb-6">
              הוסף מוצרים למועדפים על ידי לחיצה על הלב בדף המוצר
            </p>
            <Link href="/products">
              <Button className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700">
                המשך לקנות
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite: Favorite & { product: Product }) => (
              <Card key={favorite.id} className="overflow-hidden group border border-amber-200">
                <div className="relative aspect-square">
                  <img
                    src={favorite.product.mainImage}
                    alt={favorite.product.name}
                    className="object-cover w-full h-full"
                  />
                  <button
                    onClick={() => removeFavoriteMutation.mutate(favorite.product.id)}
                    className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full hover:bg-red-100 transition-colors"
                    aria-label="הסר מהמועדפים"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-1 text-lg line-clamp-1">
                    <Link href={`/product/${favorite.product.id}`} className="hover:text-primary transition-colors">
                      {favorite.product.name}
                    </Link>
                  </h3>
                  <div className="flex justify-between items-center mt-4">
                    <div className="font-bold text-lg">
                      {favorite.product.salePrice ? (
                        <div className="flex flex-col">
                          <span className="text-primary">
                            {formatPrice(favorite.product.salePrice)}
                          </span>
                          <span className="text-muted-foreground text-sm line-through">
                            {formatPrice(favorite.product.price)}
                          </span>
                        </div>
                      ) : (
                        <span>{formatPrice(favorite.product.price)}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700"
                      onClick={() => handleAddToCart(favorite.product)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      הוסף לסל
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}