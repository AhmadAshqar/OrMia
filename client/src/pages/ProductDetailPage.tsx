import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import TopBar from "@/components/layout/TopBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartContext } from "@/components/cart/CartContext";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart, 
  Share2, 
  MinusIcon, 
  PlusIcon, 
  Star, 
  StarHalf,
  Truck,
  RotateCcw,
  Check,
  ShoppingBag
} from "lucide-react";
import FeaturedProducts from "@/components/products/FeaturedProducts";

const ProductDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const cartContext = useContext(CartContext);
  const addItem = cartContext?.addItem;
  const [quantity, setQuantity] = useState(1);
  
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: [`/api/products/${id}`],
  });
  
  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const handleAddToCart = () => {
    if (product && addItem) {
      // We already check that addItem exists, so we can safely call it
      addItem?.(product, quantity);
      toast({
        title: t("add_to_cart"),
        description: `${product.name} ${t("add_to_cart")}`,
      });
    }
  };
  
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-primary text-primary" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-primary text-primary" />);
    }

    return stars;
  };
  
  if (isLoading) {
    return (
      <>
        <TopBar />
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="w-full aspect-square" />
            <div>
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/4 mb-4" />
              <Skeleton className="h-6 w-1/2 mb-8" />
              <Skeleton className="h-24 w-full mb-8" />
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }
  
  if (!product) {
    return (
      <>
        <TopBar />
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-medium mb-4">המוצר לא נמצא</h1>
          <p className="mb-8">המוצר שחיפשת אינו קיים או שהוסר מהחנות.</p>
          <Button asChild>
            <Link href="/products">חזרה למוצרים</Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <TopBar />
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            <div className="mb-4 bg-gray-50 overflow-hidden">
              <img 
                src={product.mainImage} 
                alt={product.name} 
                className="w-full object-cover"
              />
            </div>
            
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <div key={index} className="bg-gray-50 cursor-pointer">
                    <img 
                      src={image} 
                      alt={`${product.name} - תמונה ${index + 1}`} 
                      className="w-full h-24 object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-serif mb-2">{product.name}</h1>
            
            <div className="flex items-center mb-4">
              <div className="flex text-primary">
                {renderStars(product.rating)}
              </div>
              <span className="mr-2 text-sm text-foreground/70">
                ({product.reviewCount} {product.reviewCount === 1 ? 'ביקורת' : 'ביקורות'})
              </span>
            </div>
            
            <div className="mb-6">
              {product.salePrice ? (
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-medium text-primary">{formatPrice(product.salePrice)}</span>
                  <span className="text-lg line-through text-foreground/60">{formatPrice(product.price)}</span>
                </div>
              ) : (
                <span className="text-2xl font-medium text-primary">{formatPrice(product.price)}</span>
              )}
            </div>
            
            <div className="mb-8">
              <p className="leading-relaxed">{product.description}</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <span className="mr-2">{t("quantity")}:</span>
                <div className="flex items-center border border-gray-300">
                  <button
                    className="w-10 h-10 flex items-center justify-center border-l border-gray-300"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="w-10 h-10 flex items-center justify-center">{quantity}</span>
                  <button
                    className="w-10 h-10 flex items-center justify-center border-r border-gray-300"
                    onClick={incrementQuantity}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <span className="mr-4 text-sm">
                  <span className={product.inStock ? "text-green-600" : "text-red-600"}>
                    {product.inStock ? t("in_stock") : t("out_of_stock")}
                  </span>
                </span>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={handleAddToCart} 
                  className="flex-1 bg-black hover:bg-primary text-white"
                  disabled={!product.inStock || !addItem}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {t("add_to_cart")}
                </Button>
                
                <Button variant="outline" className="w-12 h-12 p-0">
                  <Heart className="h-5 w-5" />
                </Button>
                
                <Button variant="outline" className="w-12 h-12 p-0">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-start mb-2">
                <span className="min-w-24 font-medium">{t("sku")}:</span>
                <span>{product.sku}</span>
              </div>
              <div className="flex items-start mb-2">
                <span className="min-w-24 font-medium">{t("category")}:</span>
                <Link 
                  href={`/products/${product.categorySlug}`}
                  className="text-primary hover:underline"
                >
                  {product.categoryName}
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start border-b">
              <TabsTrigger value="description">{t("description")}</TabsTrigger>
              <TabsTrigger value="shipping">{t("shipping_info")}</TabsTrigger>
              <TabsTrigger value="returns">{t("returns")}</TabsTrigger>
              <TabsTrigger value="reviews">{t("reviews")}</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="py-4">
              <div className="prose max-w-none">
                <p>{product.longDescription || product.description}</p>
                
                <h3 className="text-xl font-medium mb-4 mt-8">תכונות מויסנייט</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="text-primary mt-1 ml-2" />
                    <span>נצנוץ מרהיב וזוהר – מויסנייט נוצץ 2.5 פעמים יותר מיהלום רגיל</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-primary mt-1 ml-2" />
                    <span>עמידות גבוהה מאוד – דירוג 9.25 בסולם מוס (יהלום הוא 10)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-primary mt-1 ml-2" />
                    <span>אלטרנטיבה אתית ליהלומים – מויסנייט מיוצר במעבדה ואינו מעורב בכריית יהלומים מזיקה</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="text-primary mt-1 ml-2" />
                    <span>ערך מעולה למחיר – נראה כמו יהלום יוקרתי במחיר נגיש בהרבה</span>
                  </li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="shipping" className="py-4">
              <div className="prose max-w-none">
                <div className="flex items-start mb-6">
                  <Truck className="text-primary h-12 w-12 mt-1 ml-6" />
                  <div>
                    <h3 className="text-xl font-medium mb-2">משלוח לכל רחבי ישראל</h3>
                    <p>אנו מספקים משלוח מהיר ומאובטח לכל רחבי ישראל. הזמנות מעל ₪1,000 זכאיות למשלוח חינם.</p>
                    <ul className="mt-4">
                      <li>משלוח רגיל: 3-5 ימי עסקים (₪35)</li>
                      <li>משלוח מהיר: 1-2 ימי עסקים (₪60)</li>
                      <li>משלוח חינם בהזמנות מעל ₪1,000</li>
                    </ul>
                  </div>
                </div>
                
                <p>המוצרים נשלחים באריזת מתנה יוקרתית, מוגנים היטב כדי להבטיח שיגיעו אליך במצב מושלם.</p>
              </div>
            </TabsContent>
            <TabsContent value="returns" className="py-4">
              <div className="prose max-w-none">
                <div className="flex items-start mb-6">
                  <RotateCcw className="text-primary h-12 w-12 mt-1 ml-6" />
                  <div>
                    <h3 className="text-xl font-medium mb-2">מדיניות החזרה והחלפה</h3>
                    <p>אנו מציעים מדיניות החזרה של 30 יום. אם אינך מרוצה מהרכישה שלך מכל סיבה שהיא, תוכל להחזיר את המוצר תוך 30 יום מיום קבלתו לקבלת החזר מלא או החלפה.</p>
                  </div>
                </div>
                
                <p>תנאים להחזרת מוצר:</p>
                <ul>
                  <li>המוצר חייב להיות במצב מקורי וללא נזק</li>
                  <li>יש לצרף את חשבונית הקנייה המקורית</li>
                  <li>המוצר חייב להיות באריזה המקורית</li>
                </ul>
                
                <p>שים לב: הוצאות המשלוח להחזרת המוצר הן באחריות הלקוח, אלא אם המוצר הגיע פגום או שגוי.</p>
              </div>
            </TabsContent>
            <TabsContent value="reviews" className="py-4">
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    <span className="text-4xl font-medium">{product.rating.toFixed(1)}</span>
                    <span className="text-sm text-foreground/70 mr-2">/ 5</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex text-primary">
                      {renderStars(product.rating)}
                    </div>
                    <span className="text-sm text-foreground/70">
                      מבוסס על {product.reviewCount} ביקורות
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Sample reviews - in a real application these would come from the API */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center mb-2">
                    <div className="flex text-primary">
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4 fill-primary" />
                    </div>
                    <span className="mr-2 font-medium">מוצר מדהים!</span>
                  </div>
                  <p className="mb-2">איכות מדהימה, ממש כמו יהלום אמיתי אבל במחיר הרבה יותר נגיש. קיבלתי המון מחמאות!</p>
                  <div className="flex items-center text-sm text-foreground/70">
                    <span className="font-medium">לימור כ.</span>
                    <span className="mx-2">•</span>
                    <span>15 במאי, 2023</span>
                  </div>
                </div>
                
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex items-center mb-2">
                    <div className="flex text-primary">
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4 fill-primary" />
                      <Star className="h-4 w-4" />
                    </div>
                    <span className="mr-2 font-medium">שווה את הכסף</span>
                  </div>
                  <p className="mb-2">מוצר יפה מאוד ואיכותי. הברק שלו מרשים וממש נראה כמו יהלום אמיתי. מורידה כוכב רק בגלל זמן המשלוח שהיה קצת ארוך.</p>
                  <div className="flex items-center text-sm text-foreground/70">
                    <span className="font-medium">יעקב ל.</span>
                    <span className="mx-2">•</span>
                    <span>3 באפריל, 2023</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-serif mb-8">{t("related_products")}</h2>
          <FeaturedProducts />
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default ProductDetailPage;
