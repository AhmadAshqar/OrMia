import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CartContext } from "@/components/cart/CartContext";
import { formatPrice } from "@/lib/utils";
import { 
  Form,
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  CreditCard, 
  Package2, 
  Home, 
  CheckCircle 
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const checkoutFormSchema = z.object({
  firstName: z.string().min(2, { message: "שם פרטי חייב להכיל לפחות 2 תווים" }),
  lastName: z.string().min(2, { message: "שם משפחה חייב להכיל לפחות 2 תווים" }),
  email: z.string().email({ message: "נא להזין כתובת דוא\"ל תקינה" }),
  phone: z.string().min(9, { message: "מספר טלפון חייב להכיל לפחות 9 ספרות" }),
  address: z.string().min(5, { message: "כתובת חייבת להכיל לפחות 5 תווים" }),
  city: z.string().min(2, { message: "עיר חייבת להכיל לפחות 2 תווים" }),
  postalCode: z.string().min(5, { message: "מיקוד חייב להכיל לפחות 5 ספרות" }),
  sameAsShipping: z.boolean().default(true),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "יש לאשר את תנאי השימוש ומדיניות הפרטיות כדי להמשיך"
  })
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

const CheckoutPage = () => {
  const { t } = useTranslation();
  const cartContext = useContext(CartContext);
  const items = cartContext?.items || [];
  const subtotal = cartContext?.subtotal || 0;
  const total = cartContext?.total || 0;
  const clearCart = cartContext?.clearCart;
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      sameAsShipping: true,
      shippingAddress: "",
      shippingCity: "",
      shippingPostalCode: "",
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCvv: "",
      acceptTerms: false
    }
  });

  const watchSameAsShipping = form.watch("sameAsShipping");

  const onSubmit = async (data: CheckoutFormValues) => {
    if (items.length === 0) {
      toast({
        title: "הסל ריק",
        description: "אין פריטים בסל הקניות שלך",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate processing for demo purposes
    setTimeout(() => {
      // Clear cart and show success
      if (clearCart) clearCart();
      toast({
        title: "ההזמנה נשלחה בהצלחה!",
        description: "פרטי ההזמנה נשלחו לדוא\"ל שלך",
        variant: "default"
      });
      setLocation("/");
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <>
      <Header />
      
      <div className="bg-gray-50 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-serif mb-2">{t("checkout")}</h1>
        </div>
      </div>
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Home className="mr-2 h-5 w-5" />
                        {t("billing_details")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("first_name")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("last_name")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("email")}</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("phone")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("address")}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("city")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("postal_code")}</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="sameAsShipping"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{t("same_as_billing")}</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {!watchSameAsShipping && (
                        <div className="space-y-4 border-t pt-4">
                          <h3 className="font-medium">{t("shipping_details")}</h3>
                          <FormField
                            control={form.control}
                            name="shippingAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("address")}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="shippingCity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("city")}</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="shippingPostalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("postal_code")}</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CreditCard className="mr-2 h-5 w-5" />
                        {t("payment")}
                      </CardTitle>
                      <CardDescription>
                        בחר את אמצעי התשלום המועדף עליך
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="credit-card" className="w-full" onValueChange={setPaymentMethod}>
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="credit-card">{t("credit_card")}</TabsTrigger>
                          <TabsTrigger value="paypal">{t("paypal")}</TabsTrigger>
                          <TabsTrigger value="bit">{t("bit")}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="credit-card" className="space-y-4 pt-4">
                          <FormField
                            control={form.control}
                            name="cardNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>מספר כרטיס</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="1234 5678 9012 3456" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="cardName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>שם בעל הכרטיס</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="ישראל ישראלי" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="cardExpiry"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>תאריך תפוגה</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="MM/YY" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="cardCvv"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>קוד אבטחה (CVV)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="123" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="paypal" className="py-4 text-center">
                          <p>לחץ על "בצע הזמנה" כדי להמשיך לאתר PayPal לתשלום.</p>
                        </TabsContent>
                        <TabsContent value="bit" className="py-4 text-center">
                          <p>לחץ על "בצע הזמנה" כדי לקבל הנחיות לתשלום באמצעות Bit.</p>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                    <CardContent className="mt-4 border-t pt-4">
                      <FormField
                        control={form.control}
                        name="acceptTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                אני מסכים/ה ל<Link href="/terms" className="text-primary hover:underline">תנאי השימוש</Link>,&nbsp;
                                <Link href="/privacy" className="text-primary hover:underline">מדיניות הפרטיות</Link>,&nbsp;
                                <Link href="/shipping-policy" className="text-primary hover:underline">מדיניות המשלוחים וההחזרות</Link> ומאשר/ת כי קראתי את&nbsp;
                                <Link href="/disclosure" className="text-primary hover:underline">גילוי נאות לצרכן</Link>.
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button 
                        type="submit" 
                        className="w-full bg-primary hover:bg-primary/80 text-black"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -mr-1 ml-3 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            מעבד...
                          </span>
                        ) : (
                          t("place_order")
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
              </Form>
            </div>
            
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>{t("order_summary")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-start justify-between py-2 border-b border-gray-100">
                      <div className="flex">
                        <div className="w-16 h-16 bg-gray-100 overflow-hidden rounded-sm mr-3">
                          <img 
                            src={product.mainImage} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-foreground/60">כמות: {quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-primary">
                          {formatPrice((product.salePrice || product.price) * quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="space-y-2 pt-4">
                    <div className="flex justify-between">
                      <span className="text-foreground/70">{t("subtotal")}</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-foreground/70">{t("shipping")}</span>
                      <span>
                        {subtotal >= 1000 ? (
                          <span className="text-green-600">{t("free")}</span>
                        ) : (
                          "₪35"
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between font-medium text-lg pt-4 border-t border-gray-200">
                      <span>{t("total")}</span>
                      <span className="text-primary">
                        {formatPrice(subtotal >= 1000 ? total : total + 35)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex items-center text-sm text-green-600">
                    <Package2 className="mr-2 h-4 w-4" />
                    <span>
                      {subtotal >= 1000 ? (
                        t("free_shipping")
                      ) : (
                        `חסרים לך ${formatPrice(1000 - subtotal)} לקבלת משלוח חינם`
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                      <p className="text-sm">כל העסקאות מאובטחות ומוצפנות</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default CheckoutPage;
