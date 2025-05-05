import { useQuery } from "@tanstack/react-query";
import { Instagram } from "lucide-react";
import { InstagramPost } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstagramFeed() {
  const { data: instagramPosts, isLoading } = useQuery<InstagramPost[]>({
    queryKey: ["/api/instagram"],
  });

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif mb-3">עקבו אחרינו באינסטגרם</h2>
          <div className="w-24 h-1 bg-[hsl(var(--gold))] mx-auto mb-6"></div>
          <p className="max-w-2xl mx-auto text-lg text-[hsl(var(--black-light))]">
            שתפו את התכשיטים שלכם עם התיוג #אורמיה
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {isLoading ? (
            // Skeleton loading state
            Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))
          ) : (
            instagramPosts?.map((post) => (
              <a 
                key={post.id} 
                href={post.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block group relative overflow-hidden slide-in"
              >
                <img 
                  src={post.image} 
                  alt="תמונת אינסטגרם" 
                  className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Instagram className="text-white text-3xl" />
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
