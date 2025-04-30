import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Category } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductCategories() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  return (
    <section id="collections" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif mb-3">הקולקציות שלנו</h2>
          <div className="w-24 h-1 bg-[hsl(var(--gold))] mx-auto mb-6"></div>
          <p className="max-w-2xl mx-auto text-lg text-[hsl(var(--black-light))]">
            גלו את קולקציות התכשיטים היוקרתיות שלנו, המשלבות מויסנייט באיכות גבוהה עם עיצובים מודרניים וקלאסיים.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading ? (
            // Skeleton loading state
            Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))
          ) : (
            categories?.map((category) => (
              <div key={category.id} className="group relative overflow-hidden rounded-sm slide-in">
                <img 
                  src={category.image} 
                  alt={category.name} 
                  className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
                <div className="absolute bottom-0 w-full p-6">
                  <h3 className="text-2xl font-serif text-white mb-3">{category.name}</h3>
                  <p className="text-white/80 mb-4">{category.description}</p>
                  <Button
                    asChild
                    className="inline-block py-2 px-4 bg-[hsl(var(--gold))]/90 hover:bg-[hsl(var(--gold))] text-black font-medium transition-all duration-300"
                  >
                    <Link href={`/category/${category.slug}`}>
                      לצפייה בקולקציה
                    </Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-12 text-center">
          <Button
            asChild
            variant="outline"
            className="py-3 px-8 border-2 border-black hover:border-[hsl(var(--gold))] text-black font-medium transition-colors duration-300"
          >
            <Link href="/category/all">
              לכל הקולקציות
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
