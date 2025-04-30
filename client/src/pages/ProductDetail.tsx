import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Heart, 
  Share2, 
  Star, 
  StarHalf, 
  ChevronRight, 
  ChevronLeft,
  Truck,
  Package,
  Shield
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/ProductCard";

export default function ProductDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Get product details
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", id],
  });

  // Get related products
  const { data: relatedProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/related", id],
  });

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await apiRequest('POST', '/api/cart', { productId: product.id, quantity });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      
      toast({
        title: "נוסף לסל הקניות",
        description: `${product.name} נוסף לסל הקניות בהצלחה.`,
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת המוצר לסל הקניות.",
        variant: "destructive",
      });
    }
  };

  const handleAddToWishlist = () => {
    if (!product) return;
    
    toast({
      title: "נוסף לרשימת המשאלות",
      description: `${product.name} נוסף לרשימת המשאלות בהצלחה.`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "הקישור הועתק",
        description: "קישור למוצר הועתק ללוח.",
      });
    }
  };

  // Render star ratings
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" size={16} />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" size={16} />);
    }

    // Add empty stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="text-gray-300" size={16} />);
    }

    return stars;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <Skeleton className="h-96 w-full mb-4" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-24" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-serif mb-4">המוצר לא נמצא</h1>
        <p className="mb-6">המוצר שחיפשת אינו קיים או שהוסר מהמערכת.</p>
        <Button asChild>
          <Link href="/category/all">חזרה לחנות</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumbs */}
      <div className="flex items-center text-sm mb-8">
        <Link href="/" className="text-gray-500 hover:text-[hsl(var(--gold))]">דף הבית</Link>
        <ChevronLeft className="h-4 w-4 mx-2 text-gray-500" />
        <Link href={`/category/${product.category.slug}`} className="text-gray-500 hover:text-[hsl(var(--gold))]">
          {product.category.name}
        </Link>
        <ChevronLeft className="h-4 w-4 mx-2 text-gray-500" />
        <span className="text-[hsl(var(--black))]">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product images */}
        <div>
          <div className="mb-4 bg-gray-50 h-96 flex items-center justify-center">
            <img 
              src={product.images[activeImageIndex]} 
              alt={product.name} 
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {product.images.map((image, index) => (
              <button
                key={index}
                className={`w-24 h-24 bg-gray-50 flex-shrink-0 border-2 ${
                  index === activeImageIndex ? "border-[hsl(var(--gold))]" : "border-transparent"
                }`}
                onClick={() => setActiveImageIndex(index)}
              >
                <img 
                  src={image} 
                  alt={`${product.name} - תמונה ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product details */}
        <div>
          <h1 className="text-3xl font-serif mb-2">{product.name}</h1>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {renderStars(product.rating)}
            </div>
            <span className="text-gray-500 text-sm">({product.reviewCount} ביקורות)</span>
          </div>
          
          <div className="mb-6">
            {product.discountPrice ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-semibold text-[hsl(var(--gold))]">
                  ₪{product.price.toLocaleString()}
                </span>
                <span className="text-gray-400 line-through">
                  ₪{product.discountPrice.toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="text-2xl font-semibold text-[hsl(var(--gold))]">
                ₪{product.price.toLocaleString()}
              </span>
            )}
          </div>
          
          <p className="text-gray-700 mb-6">{product.description}</p>
          
          {/* Product features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Truck className="text-[hsl(var(--gold))]" size={20} />
              <span className="text-sm">משלוח חינם מ-₪1,000</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="text-[hsl(var(--gold))]" size={20} />
              <span className="text-sm">אריזת מתנה חינם</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="text-[hsl(var(--gold))]" size={20} />
              <span className="text-sm">אחריות לכל החיים</span>
            </div>
          </div>
          
          {/* Add to cart */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Select
              value={quantity.toString()}
              onValueChange={(value) => setQuantity(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="כמות" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              className="flex-1 bg-black hover:bg-[hsl(var(--gold))] text-white py-6" 
              onClick={handleAddToCart}
            >
              הוסף לסל
            </Button>
            
            <Button 
              variant="outline" 
              className="w-12 h-12 p-0 border-gray-300" 
              onClick={handleAddToWishlist}
            >
              <Heart size={20} />
            </Button>
            
            <Button 
              variant="outline" 
              className="w-12 h-12 p-0 border-gray-300" 
              onClick={handleShare}
            >
              <Share2 size={20} />
            </Button>
          </div>
          
          {/* Product info tabs */}
          <Tabs defaultValue="details">
            <TabsList className="w-full justify-start border-b rounded-none">
              <TabsTrigger value="details">פרטי מוצר</TabsTrigger>
              <TabsTrigger value="shipping">משלוח ותשלום</TabsTrigger>
              <TabsTrigger value="returns">מדיניות החזרה</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="pt-4">
              <div className="space-y-2">
                <p className="font-semibold">מפרט:</p>
                <ul className="list-disc list-inside space-y-1">
                  {product.specifications.map((spec, index) => (
                    <li key={index}>{spec}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="shipping" className="pt-4">
              <div className="space-y-3">
                <p>אנו מציעים משלוח לכל רחבי ישראל באמצעות שליח עד הבית.</p>
                <p>זמני משלוח: 3-5 ימי עסקים.</p>
                <p>משלוח חינם בהזמנות מעל ₪1,000. עלות משלוח רגיל: ₪50.</p>
                <p>אפשרויות תשלום: כרטיס אשראי, PayPal, העברה בנקאית.</p>
              </div>
            </TabsContent>
            <TabsContent value="returns" className="pt-4">
              <div className="space-y-3">
                <p>ניתן להחזיר מוצרים תוך 14 יום מיום קבלת ההזמנה.</p>
                <p>המוצר חייב להיות באריזתו המקורית וללא סימני שימוש.</p>
                <p>אנו מציעים החלפה או החזר כספי מלא (לא כולל דמי משלוח).</p>
                <p>למידע נוסף, אנא צרו קשר עם שירות הלקוחות שלנו.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Related products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="text-2xl font-serif mb-8 text-center">מוצרים דומים שעשויים לעניין אותך</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
