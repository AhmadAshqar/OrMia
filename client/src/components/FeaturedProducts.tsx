import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeaturedProducts() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif mb-3">מוצרים מובילים</h2>
          <div className="w-24 h-1 bg-[hsl(var(--gold))] mx-auto mb-6"></div>
          <p className="max-w-2xl mx-auto text-lg text-[hsl(var(--black-light))]">
            התכשיטים היוקרתיים והמבוקשים ביותר שלנו, בעיצוב ייחודי ואיכות גבוהה.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading ? (
            // Skeleton loading state
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ))
          ) : (
            products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
        
        <div className="mt-12 text-center">
          <Button
            asChild
            variant="outline"
            className="inline-block py-3 px-8 border-2 border-black hover:border-[hsl(var(--gold))] text-black font-medium transition-colors duration-300"
          >
            <Link href="/category/all">
              לכל המוצרים
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
