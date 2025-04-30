import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Testimonial } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Testimonials() {
  const { data: testimonials, isLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  // Render star ratings (always 5 stars for testimonials as per design)
  const renderStars = (count: number = 5) => {
    return Array(count)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" size={16} />
      ));
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif mb-3">לקוחות מספרים</h2>
          <div className="w-24 h-1 bg-[hsl(var(--gold))] mx-auto mb-6"></div>
          <p className="max-w-2xl mx-auto text-lg text-[hsl(var(--black-light))]">
            מה הלקוחות שלנו אומרים על התכשיטים והשירות שלנו.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {isLoading ? (
            // Skeleton loading state
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ))
          ) : (
            testimonials?.map((testimonial) => (
              <div key={testimonial.id} className="bg-white p-6 shadow-sm rounded-sm slide-in">
                <div className="flex text-[hsl(var(--gold))] text-sm mb-4">
                  {renderStars(5)}
                </div>
                <p className="text-[hsl(var(--black-light))] italic mb-4">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <p className="font-medium">{testimonial.name}</p>
                  <span className="mx-2 text-[hsl(var(--gold))]">•</span>
                  <p className="text-sm text-[hsl(var(--black-light))]">{testimonial.location}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
