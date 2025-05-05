import { useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartContext } from "@/components/cart/CartContext";
import CartItem from "@/components/cart/CartItem";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package } from "lucide-react";

const CartPage = () => {
  const { t } = useTranslation();
  const cartContext = useContext(CartContext);
  const items = cartContext?.items || [];
  const subtotal = cartContext?.subtotal || 0;
  const total = cartContext?.total || 0;

  useEffect(() => {
    document.title = `${t("your_cart")} | אור מיה`;
  }, [t]);

  return (
    <>
      <Header />
      
      <div className="bg-gray-50 py-6 pt-32">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-serif mb-2">{t("your_cart")}</h1>
        </div>
      </div>
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-20 h-20 mb-6 text-gray-300">
                <ShoppingBag className="w-full h-full" />
              </div>
              <h2 className="text-2xl font-serif mb-4">{t("empty_cart")}</h2>
              <p className="text-gray-500 mb-8">הסל שלך ריק. התחל לקנות ומצא את התכשיט המושלם.</p>
              <Button asChild>
                <Link href="/products">
                  {t("start_shopping")}
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <div className="bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-serif mb-4">פריטים בסל</h2>
                  
                  <div className="hidden md:grid grid-cols-6 gap-4 mb-4 pb-2 border-b text-sm text-foreground/70">
                    <div className="col-span-2">{t("product")}</div>
                    <div className="text-center">{t("price")}</div>
                    <div className="text-center">{t("quantity")}</div>
                    <div className="text-center">{t("total")}</div>
                    <div></div>
                  </div>
                  
                  <div className="space-y-4">
                    {items.map(({ product, quantity }) => (
                      <CartItem 
                        key={product.id}
                        product={product}
                        quantity={quantity}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                <div className="bg-white p-6 shadow-sm sticky top-24">
                  <h2 className="text-xl font-serif mb-4">סיכום הזמנה</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-foreground/70">{t("subtotal")}</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground/70">{t("shipping")}</span>
                      <span>
                        {subtotal >= 1000 ? (
                          <span className="text-green-600">{t("free")}</span>
                        ) : (
                          t("calculated_checkout")
                        )}
                      </span>
                    </div>
                    
                    <div className="pt-3 mt-3 border-t border-gray-200 flex justify-between font-medium">
                      <span>{t("order_total")}</span>
                      <span className="text-primary text-lg">{formatPrice(total)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Button asChild className="w-full bg-black hover:bg-primary text-white">
                      <Link href="/checkout">
                        {t("proceed_checkout")}
                      </Link>
                    </Button>
                    
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/products">
                        {t("continue_shopping")}
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center text-sm text-green-600">
                      <Package className="h-4 w-4 mr-2" />
                      <span>
                        {subtotal >= 1000 ? (
                          t("free_shipping")
                        ) : (
                          `חסרים לך ${formatPrice(1000 - subtotal)} לקבלת משלוח חינם`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default CartPage;
