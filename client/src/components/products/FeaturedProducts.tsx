import { useTranslation } from "react-i18next";
import { useRef, useEffect } from "react";
import ProductCard from "./ProductCard";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedProducts = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
  });
  
  // Add animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Select all slide-in elements within this section
            const slideInElements = entry.target.querySelectorAll('.slide-in');
            slideInElements.forEach((el, index) => {
              // Add delay based on index
              setTimeout(() => {
                el.classList.add('slide-in-visible');
              }, index * 150);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const SkeletonProduct = () => (
    <div className="bg-white shadow-sm p-4">
      <Skeleton className="w-full h-64 mb-4" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/4 mb-2" />
      <div className="flex justify-between items-center mb-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );

  return (
    <section ref={sectionRef} className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif mb-3 text-gray-800">{t("featured_products")}</h2>
          <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
          <p className="max-w-2xl mx-auto text-lg text-gray-700">{t("featured_products_desc")}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {isLoading ? (
            <>
              <SkeletonProduct />
              <SkeletonProduct />
              <SkeletonProduct />
              <SkeletonProduct />
            </>
          ) : (
            products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
