import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import ProductCard from "@/components/ProductCard";
import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Product, Category } from "@shared/schema";

type SortOption = "newest" | "price-low-high" | "price-high-low" | "popularity";
type FilterState = {
  priceRange: [number, number];
  types: string[];
};

export default function ProductList() {
  const { category } = useParams();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 10000],
    types: [],
  });

  // Get products based on category
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", category],
  });

  // Get category information
  const { data: categoryInfo, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories", category],
  });

  // Get product types for filtering
  const { data: productTypes } = useQuery<string[]>({
    queryKey: ["/api/product-types"],
  });

  const handlePriceRangeChange = (value: number[]) => {
    setFilters({ ...filters, priceRange: [value[0], value[1]] });
  };

  const handleTypeFilterChange = (type: string, checked: boolean) => {
    if (checked) {
      setFilters({ ...filters, types: [...filters.types, type] });
    } else {
      setFilters({ ...filters, types: filters.types.filter(t => t !== type) });
    }
  };

  // Apply sorting and filtering
  const filteredAndSortedProducts = products
    ? products
        .filter(product => {
          const price = product.discountPrice || product.price;
          const matchesPrice = price >= filters.priceRange[0] && price <= filters.priceRange[1];
          const matchesType = filters.types.length === 0 || filters.types.includes(product.type);
          return matchesPrice && matchesType;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "price-low-high":
              return (a.discountPrice || a.price) - (b.discountPrice || b.price);
            case "price-high-low":
              return (b.discountPrice || b.price) - (a.discountPrice || a.price);
            case "popularity":
              return b.reviewCount - a.reviewCount;
            case "newest":
            default:
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        })
    : [];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Category header */}
      <div className="mb-12 text-center">
        {categoryLoading ? (
          <Skeleton className="h-12 w-1/3 mx-auto mb-4" />
        ) : (
          <>
            <h1 className="text-4xl font-serif mb-4">{categoryInfo?.name || "כל המוצרים"}</h1>
            <div className="w-24 h-1 bg-[hsl(var(--gold))] mx-auto mb-6"></div>
            <p className="max-w-2xl mx-auto text-lg text-[hsl(var(--black-light))]">
              {categoryInfo?.description || "גלה את המבחר העשיר שלנו של תכשיטי מויסנייט באיכות גבוהה"}
            </p>
          </>
        )}
      </div>

      {/* Filters and sort */}
      <div className="flex flex-col md:flex-row justify-between mb-8 gap-6">
        <div className="md:w-1/4 space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">סינון לפי מחיר</h3>
            <div className="px-2">
              <Slider
                value={[filters.priceRange[0], filters.priceRange[1]]}
                min={0}
                max={10000}
                step={100}
                onValueChange={handlePriceRangeChange}
                className="mb-2"
              />
              <div className="flex justify-between text-sm">
                <span>₪{filters.priceRange[0].toLocaleString()}</span>
                <span>₪{filters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">סינון לפי סוג</h3>
            <div className="space-y-2">
              {productTypes?.map((type) => (
                <div key={type} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox 
                    id={`type-${type}`}
                    checked={filters.types.includes(type)}
                    onCheckedChange={(checked) => handleTypeFilterChange(type, checked as boolean)}
                  />
                  <Label htmlFor={`type-${type}`}>{type}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-gray-500">
              {filteredAndSortedProducts.length} מוצרים
            </span>
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="מיין לפי" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">החדש ביותר</SelectItem>
                <SelectItem value="price-low-high">מחיר: מהנמוך לגבוה</SelectItem>
                <SelectItem value="price-high-low">מחיר: מהגבוה לנמוך</SelectItem>
                <SelectItem value="popularity">פופולריות</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">לא נמצאו מוצרים התואמים את הסינון שבחרת.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
