import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Favorite, Product } from "@shared/schema";
import { Link } from "wouter";
import { Heart, Loader2, ShoppingCart, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import MainLayout from "@/components/layout/MainLayout";
import { useCart } from "@/components/cart/CartContext";
import { formatPrice } from "@/lib/utils";

export default function FavoritesPage() {
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Query to get favorites
  const { data: favorites, isLoading } = useQuery({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/favorites");
      return await res.json();
    },
  });

  // Mutation to remove a favorite
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

  // Handler for removing a favorite
  const handleRemoveFavorite = (productId: number) => {
    removeFavoriteMutation.mutate(productId);
  };

  // Handler for adding to cart
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
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            המוצרים שסימנת כמועדפים יישמרו כאן לנוחיותך
          </p>
        </div>

        {!favorites || favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">אין לך מוצרים מועדפים</h2>
            <p className="text-muted-foreground mb-6">
              סמן מוצרים כמועדפים במהלך הגלישה באתר וצור את רשימת המוצרים האהובים עליך
            </p>
            <Button asChild className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700">
              <Link href="/products">המשך לקנות</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {favorites.map((favorite: Favorite & { product: Product }) => (
              <Card key={favorite.id} className="overflow-hidden border border-amber-200 transition-all group hover:border-amber-400 hover:shadow-md">
                <div className="relative aspect-square overflow-hidden">
                  <Link href={`/product/${favorite.product.id}`}>
                    <img 
                      src={favorite.product.mainImage} 
                      alt={favorite.product.name} 
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </Link>
                  {favorite.product.salePrice && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                      מבצע
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 left-2 h-8 w-8 opacity-80 hover:opacity-100"
                    onClick={() => handleRemoveFavorite(favorite.product.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardContent className="p-4 text-right">
                  <Link href={`/product/${favorite.product.id}`}>
                    <h3 className="font-medium text-lg mb-1 hover:text-primary">
                      {favorite.product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex flex-col items-end">
                      {favorite.product.salePrice ? (
                        <>
                          <span className="text-muted-foreground line-through text-sm">
                            {formatPrice(favorite.product.price)}
                          </span>
                          <span className="font-bold text-red-500">
                            {formatPrice(favorite.product.salePrice)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold">
                          {formatPrice(favorite.product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex justify-center">
                  <Button
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700"
                    onClick={() => handleAddToCart(favorite.product)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    הוסף לסל
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}