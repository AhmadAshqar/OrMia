import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ProductGridProps {
  category?: string;
}

const ProductGrid = ({ category }: ProductGridProps) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [selectedCategory, setSelectedCategory] = useState(category || "all");
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Determine the API endpoint based on the selected category
  const getApiEndpoint = () => {
    if (selectedCategory === 'new') {
      return '/api/products/new';
    } else if (selectedCategory === 'featured') {
      return '/api/products/featured';
    } else if (selectedCategory !== 'all') {
      return `/api/categories/${selectedCategory}/products`;
    } else {
      return '/api/products';
    }
  };

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: [getApiEndpoint()],
  });
  
  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
    }
  }, [category]);
  
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

    if (gridRef.current) {
      observer.observe(gridRef.current);
    }

    return () => {
      if (gridRef.current) {
        observer.unobserve(gridRef.current);
      }
    };
  }, [products]);

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

  const sortProducts = (products: Product[] | undefined) => {
    if (!products) return [];
    
    const sortedProducts = [...products];
    
    switch (sortBy) {
      case "price-low-high":
        return sortedProducts.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
      case "price-high-low":
        return sortedProducts.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
      case "popularity":
        return sortedProducts.sort((a, b) => b.reviewCount - a.reviewCount);
      case "discount":
        return sortedProducts.sort((a, b) => {
          const discountA = a.salePrice ? a.price - a.salePrice : 0;
          const discountB = b.salePrice ? b.price - b.salePrice : 0;
          return discountB - discountA;
        });
      default:
        return sortedProducts;
    }
  };

  const filterByPrice = (products: Product[] | undefined) => {
    if (!products) return [];
    
    console.log("Filtering products:", products.length);
    console.log("Price range:", priceRange);
    
    // Make sure price range values are valid
    const minPrice = Math.max(0, priceRange[0]);
    const maxPrice = Math.max(minPrice, priceRange[1]);
    
    // Check each product price against the price range
    const filtered = products.filter(product => {
      // Get the actual price (sale price if available, otherwise regular price)
      let productPrice = product.price;
      if (product.salePrice !== null && product.salePrice !== undefined && product.salePrice > 0) {
        productPrice = product.salePrice;
      }
      
      // Handle NaN cases or invalid prices
      if (isNaN(productPrice) || productPrice === null) {
        return false;
      }
      
      const withinRange = productPrice >= minPrice && productPrice <= maxPrice;
      
      if (!withinRange) {
        console.log("Filtered out product:", product.id, product.name, "Price:", productPrice);
      }
      
      return withinRange;
    });
    
    console.log("Filtered products:", filtered.length);
    return filtered;
  };

  const displayedProducts = filterByPrice(sortProducts(products));

  const categories = [
    { value: "all", label: t("all") },
    { value: "new", label: "NEW" },
    { value: "rings", label: t("rings") },
    { value: "necklaces", label: t("necklaces") },
    { value: "earrings", label: t("earrings") },
    { value: "bracelets", label: t("bracelets") },
  ];

  // Debounce price change to prevent excessive re-renders
  const debouncedPriceChange = useCallback((values: number[]) => {
    console.log("Setting price range to:", values);
    setPriceRange(values);
  }, []);
  
  // Store timeout reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handlePriceChange = (values: number[]) => {
    // Clear any existing timeout
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Set a new timeout
    timerRef.current = setTimeout(() => {
      debouncedPriceChange(values);
    }, 300); // 300ms debounce time
  };

  const resetFilters = () => {
    debouncedPriceChange([0, 5000]);
    setSelectedCategory("all");
    setSortBy("newest");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar Filters */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-serif mb-6">{t("filter")}</h3>
          
          <div className="mb-6">
            <h4 className="font-medium mb-2">{t("sort_by")}</h4>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder={t("sort_by")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("newest")}</SelectItem>
                <SelectItem value="price-low-high">{t("price_low_high")}</SelectItem>
                <SelectItem value="price-high-low">{t("price_high_low")}</SelectItem>
                <SelectItem value="popularity">{t("popularity")}</SelectItem>
                <SelectItem value="discount">{t("discount")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Accordion type="single" collapsible>
            <AccordionItem value="price">
              <AccordionTrigger>{t("price_range")}</AccordionTrigger>
              <AccordionContent>
                <div className="py-4">
                  <div className="flex flex-row gap-4 mb-4 items-center">
                    <div className="flex-1">
                      <label className="text-sm mb-1 block">מ</label>
                      <input 
                        type="number" 
                        min="0" 
                        max={priceRange[1]}
                        value={priceRange[0]} 
                        onChange={(e) => {
                          const newMin = Math.max(0, Number(e.target.value));
                          handlePriceChange([newMin, priceRange[1]]);
                        }}
                        onBlur={(e) => {
                          // Force re-evaluation on blur
                          const newMin = Math.max(0, Number(e.target.value));
                          handlePriceChange([newMin, priceRange[1]]);
                        }}
                        className="w-full p-2 border rounded-md text-right"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm mb-1 block">עד</label>
                      <input 
                        type="number" 
                        min={priceRange[0]} 
                        max="10000"
                        value={priceRange[1]} 
                        onChange={(e) => {
                          const newMax = Math.max(priceRange[0], Number(e.target.value));
                          handlePriceChange([priceRange[0], newMax]);
                        }}
                        onBlur={(e) => {
                          // Force re-evaluation on blur
                          const newMax = Math.max(priceRange[0], Number(e.target.value));
                          handlePriceChange([priceRange[0], newMax]);
                        }}
                        className="w-full p-2 border rounded-md text-right"
                      />
                    </div>
                  </div>

                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={resetFilters}
            >
              {t("reset_filters")}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Product Grid */}
      <div ref={gridRef} className="lg:col-span-3">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonProduct />
            <SkeletonProduct />
            <SkeletonProduct />
            <SkeletonProduct />
            <SkeletonProduct />
            <SkeletonProduct />
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium mb-2">אין מוצרים מתאימים</h3>
            <p className="text-foreground/70">נסה לשנות את הסינון או לאפס את הסינון</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
