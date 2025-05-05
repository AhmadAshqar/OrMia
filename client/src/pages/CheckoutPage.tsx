import { useState, useContext, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";

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
  CheckCircle,
  Truck,
  ShieldCheck,
  Lock,
  AlertTriangle,
  BellRing,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { SiVisa, SiMastercard, SiAmericanexpress, SiPaypal, SiApple } from "react-icons/si";

const checkoutFormSchema = z.object({
  // Personal information
  firstName: z.string().min(2, { message: "שם פרטי חייב להכיל לפחות 2 תווים" }),
  lastName: z.string().min(2, { message: "שם משפחה חייב להכיל לפחות 2 תווים" }),
  email: z.string().email({ message: "נא להזין כתובת דוא\"ל תקינה" }),
  phone: z.string().min(9, { message: "מספר טלפון חייב להכיל לפחות 9 ספרות" }),
  
  // Address information
  address: z.string().min(5, { message: "כתובת חייבת להכיל לפחות 5 תווים" }),
  apartment: z.string().optional(),
  city: z.string().min(2, { message: "עיר חייבת להכיל לפחות 2 תווים" }),
  postalCode: z.string().min(5, { message: "מיקוד חייב להכיל לפחות 5 ספרות" }),
  country: z.string().default("ישראל"),
  
  // Shipping options
  sameAsShipping: z.boolean().default(true),
  
  // Separate shipping address (if not same as billing)
  billingFirstName: z.string().optional(),
  billingLastName: z.string().optional(),
  billingAddress: z.string().optional(),
  billingApartment: z.string().optional(),
  billingCity: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCountry: z.string().optional(),
  billingPhone: z.string().optional(),
  
  // Shipping method
  shippingMethod: z.enum(["standard", "express"]).default("standard"),
  
  // Payment information
  paymentMethod: z.enum(["credit-card", "paypal", "bit"]).default("credit-card"),
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
  
  // Promo code
  promoCode: z.string().optional(),
  
  // Create account (for guests)
  createAccount: z.boolean().default(false),
  password: z.string().min(8, { message: "סיסמה חייבת להכיל לפחות 8 תווים" }).optional(),
  
  // Terms acceptance
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
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // Form and submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  
  // Promo code state
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [promoData, setPromoData] = useState<any>(null);
  
  // Shipping method state
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  
  // Calculate shipping costs based on method, subtotal, and promo code
  const shippingCost = (() => {
    // Free shipping for express delivery
    if (shippingMethod === "express") {
      return 50;
    }
    
    // Free shipping from promo code (only for standard shipping)
    if (promoApplied && promoData && promoData.discountType === 'shipping') {
      return 0;
    }
    
    // Free shipping for orders above threshold
    if (subtotal >= 250) {
      return 0;
    }
    
    // Standard shipping rate
    return 35;
  })();
  
  // Calculate discounted subtotal and total
  const discountedSubtotal = subtotal - discount;
  const finalTotal = discountedSubtotal + shippingCost;
  
  // Calculate tax (included in price, 17% VAT in Israel)
  const tax = parseFloat((discountedSubtotal * 0.17).toFixed(2));

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      // Personal details
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      
      // Address
      address: "",
      apartment: "",
      city: "",
      postalCode: "",
      country: "ישראל",
      
      // Shipping options
      sameAsShipping: true,
      
      // Payment
      paymentMethod: "credit-card",
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCvv: "",
      
      // Shipping method
      shippingMethod: "standard",
      
      // Promo code
      promoCode: "",
      
      // Account creation
      createAccount: false,
      
      // Terms
      acceptTerms: false
    }
  });

  // Watch for form value changes
  const watchSameAsShipping = form.watch("sameAsShipping");
  const watchShippingMethod = form.watch("shippingMethod");
  const watchCreateAccount = form.watch("createAccount");
  
  // Update shipping method when form value changes
  useEffect(() => {
    setShippingMethod(watchShippingMethod as "standard" | "express");
  }, [watchShippingMethod]);
  
  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user) {
      form.setValue("email", user.email);
      if (user.firstName) form.setValue("firstName", user.firstName);
      if (user.lastName) form.setValue("lastName", user.lastName);
    }
  }, [user, form]);
  
  // Function to apply promo code using the API
  const applyPromoCode = async () => {
    const code = form.getValues("promoCode");
    
    if (!code) {
      toast({
        title: "שגיאה",
        description: "נא להזין קוד קופון",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Call the promo code validation API
      const response = await fetch('/api/validate-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'קוד הקופון אינו תקף');
      }
      
      const promoData = await response.json();
      
      // Check if the promo has a minimum order requirement
      if (promoData.minOrder > 0 && subtotal < promoData.minOrder) {
        toast({
          title: "סכום הזמנה מינימלי",
          description: `קוד הקופון תקף להזמנות מעל ${formatPrice(promoData.minOrder)}`,
          variant: "destructive"
        });
        return;
      }
      
      // Calculate discount based on type
      let discountAmount = 0;
      
      if (promoData.discountType === 'percent') {
        // Percentage discount
        discountAmount = subtotal * (promoData.discount / 100);
      } else if (promoData.discountType === 'fixed') {
        // Fixed amount discount
        discountAmount = promoData.discount;
      } else if (promoData.discountType === 'shipping' && shippingMethod !== 'express') {
        // Free standard shipping
        discountAmount = 0;
        // We'll handle this separately in the shipping cost calculation
      }
      
      setDiscount(discountAmount);
      setPromoApplied(true);
      setPromoData(promoData);
      
      toast({
        title: "קוד קופון הופעל!",
        description: promoData.message,
        variant: "default"
      });
    } catch (error) {
      console.error('Error validating promo code:', error);
      toast({
        title: "קוד קופון לא תקין",
        description: error instanceof Error ? error.message : "קוד הקופון שהזנת אינו תקף",
        variant: "destructive"
      });
    }
  };

  // Reset promo code
  const resetPromoCode = () => {
    setPromoApplied(false);
    setDiscount(0);
    setPromoData(null);
    form.setValue("promoCode", "");
    toast({
      title: "קוד קופון בוטל",
      description: "קוד הקופון הוסר מההזמנה",
      variant: "default"
    });
  };

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

    // Create shipping address object
    const shippingAddress = {
      firstName: data.firstName,
      lastName: data.lastName,
      address: data.address,
      apartment: data.apartment || "",
      city: data.city,
      zipCode: data.postalCode,
      country: data.country,
      phone: data.phone
    };

    // Create billing address object if different from shipping
    const billingAddress = data.sameAsShipping 
      ? shippingAddress 
      : {
          firstName: data.billingFirstName || "",
          lastName: data.billingLastName || "",
          address: data.billingAddress || "",
          apartment: data.billingApartment || "",
          city: data.billingCity || "",
          zipCode: data.billingPostalCode || "",
          country: data.billingCountry || "ישראל",
          phone: data.billingPhone || data.phone
        };

    try {
      // Send checkout data to API including all relevant information
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Order items
          items,
          
          // Customer information
          email: data.email,
          
          // Addresses
          shippingAddress,
          billingAddress,
          
          // Payment details
          paymentMethod: data.paymentMethod,
          
          // Shipping method
          shippingMethod: data.shippingMethod,
          
          // Pricing information
          subtotal: discountedSubtotal,
          total: finalTotal,
          shippingCost,
          tax,
          
          // Discount information 
          discount: discount,
          promoCode: promoApplied ? form.getValues("promoCode") : null,
          
          // Account creation (for guests)
          createAccount: data.createAccount,
          password: data.createAccount ? data.password : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'שגיאה בביצוע ההזמנה');
      }

      const result = await response.json();
      
      // Clear cart and show success
      if (clearCart) clearCart();
      
      toast({
        title: "ההזמנה נשלחה בהצלחה!",
        description: "פרטי ההזמנה נשלחו לדוא\"ל שלך",
        variant: "default"
      });
      
      // Redirect to home page after successful checkout
      setLocation("/");
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "שגיאה בביצוע ההזמנה",
        description: error instanceof Error ? error.message : "אירעה שגיאה, אנא נסה שוב מאוחר יותר",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      
      <div className="bg-gray-50 py-6">
        <div className="container mx-auto px-4" dir="rtl">
          <h1 className="text-3xl md:text-4xl font-serif mb-2 text-right">{t("checkout")}</h1>
        </div>
      </div>
      
      <section className="py-12 dir-rtl" dir="rtl">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 dir-rtl">
            <div className="lg:col-span-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Home className="ml-2 h-5 w-5" />
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
                          <h3 className="font-medium">פרטי משלוח</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="billingFirstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>שם פרטי</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="billingLastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>שם משפחה</FormLabel>
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
                            name="billingAddress"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>כתובת</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="billingApartment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>דירה / כניסה (אופציונלי)</FormLabel>
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
                              name="billingCity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>עיר</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="billingPostalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>מיקוד</FormLabel>
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
                            name="billingPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>טלפון</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Shipping Method */}
                  <Card id="shipping-method">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Truck className="ml-2 h-5 w-5" />
                        שיטת משלוח
                      </CardTitle>
                      <CardDescription>
                        בחר את שיטת המשלוח המועדפת עליך
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="shippingMethod"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-3"
                              >
                                <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                                  <FormControl>
                                    <RadioGroupItem value="standard" />
                                  </FormControl>
                                  <div className="flex-1">
                                    <FormLabel className="text-base">
                                      משלוח רגיל {subtotal >= 250 ? 
                                        <Badge className="mr-2 bg-green-600">חינם</Badge> : 
                                        <span className="font-medium">{formatPrice(35)}</span>}
                                    </FormLabel>
                                    <FormDescription>
                                      משלוח תוך 5-7 ימי עסקים
                                    </FormDescription>
                                  </div>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                                  <FormControl>
                                    <RadioGroupItem value="express" />
                                  </FormControl>
                                  <div className="flex-1">
                                    <FormLabel className="text-base">
                                      משלוח מהיר <span className="font-medium">{formatPrice(50)}</span>
                                    </FormLabel>
                                    <FormDescription>
                                      משלוח מהיר תוך 1-3 ימי עסקים
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Promo Code */}
                  <Card id="promo-code">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Sparkles className="ml-2 h-5 w-5" />
                        קוד קופון
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-4">
                        <FormField
                          control={form.control}
                          name="promoCode"
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>יש לך קוד קופון?</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="הכנס קוד קופון" 
                                  disabled={promoApplied}
                                />
                              </FormControl>
                              <FormDescription>
                                קודי קופון לדוגמה: WELCOME10, ORMIA20
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {promoApplied ? (
                          <Button 
                            type="button" 
                            onClick={resetPromoCode} 
                            variant="outline"
                            className="mb-0.5"
                          >
                            בטל קופון
                          </Button>
                        ) : (
                          <Button 
                            type="button" 
                            onClick={applyPromoCode} 
                            className="mb-0.5"
                          >
                            החל קופון
                          </Button>
                        )}
                      </div>
                      
                      {promoApplied && (
                        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md text-sm flex items-center">
                          <BellRing className="ml-2 h-5 w-5" />
                          <span>
                            קוד קופון <strong>{form.getValues("promoCode")}</strong> הופעל! קיבלת הנחה של {formatPrice(discount)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Payment options */}
                  <Card id="payment-options">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CreditCard className="ml-2 h-5 w-5" />
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
              <div className="sticky top-24">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>{t("order_summary")}</CardTitle>
                    <CardDescription>סיכום ההזמנה שלך</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Product list with details */}
                    <div className="max-h-80 overflow-y-auto space-y-3 pl-1 text-right">
                      {items.map(({ product, quantity }) => (
                        <div key={product.id} className="flex items-start justify-between py-2 border-b border-gray-100">
                          <div className="flex">
                            <div className="w-16 h-16 bg-gray-100 overflow-hidden rounded-sm ml-3 flex-shrink-0">
                              <img 
                                src={product.mainImage} 
                                alt={product.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-foreground/60">כמות: {quantity}</p>
                              <p className="text-sm text-primary">
                                {formatPrice(product.salePrice || product.price)} / יח'
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-primary">
                              {formatPrice((product.salePrice || product.price) * quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Price breakdown */}
                    <div className="space-y-2 pt-4">
                      <div className="flex justify-between">
                        <span className="text-foreground/70">{t("subtotal")}</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      
                      {promoApplied && discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>הנחה ({form.getValues("promoCode")})</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-foreground/70">{t("shipping")}</span>
                        <span>
                          {shippingMethod === "express" ? (
                            formatPrice(50)
                          ) : subtotal >= 250 ? (
                            <span className="text-green-600">{t("free")}</span>
                          ) : (
                            formatPrice(35)
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>מע"מ כלול (17%)</span>
                        <span>{formatPrice(tax)}</span>
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between font-bold text-lg pt-2">
                        <span>{t("total")}</span>
                        <span className="text-primary">
                          {formatPrice(finalTotal)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Free shipping promotion */}
                    {subtotal < 250 && shippingMethod === "standard" && (
                      <div className="pt-4 flex items-center text-sm text-green-600 border-t">
                        <Package2 className="ml-2 h-4 w-4" />
                        <span>
                          חסרים לך {formatPrice(250 - subtotal)} לקבלת משלוח חינם
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Payment security and customer support */}
                <Card className="mb-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <ShieldCheck className="ml-2 h-5 w-5" />
                      אבטחה ותשלומים
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Lock className="ml-2 h-4 w-4 text-green-600" />
                      <p>כל העסקאות מאובטחות ומוצפנות SSL</p>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="ml-2 h-4 w-4 text-green-600" />
                      <p>הגנת לקוח מלאה בכל רכישה</p>
                    </div>
                    <div className="flex items-center text-sm">
                      <Package2 className="ml-2 h-4 w-4 text-green-600" />
                      <p>משלוחים מהירים לכל הארץ</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Customer support info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">שירות לקוחות</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                      </svg>
                      <span>077-3344558</span>
                    </p>
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                      <span>service@ormiajewelry.co.il</span>
                    </p>
                    <p className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <span>ימים א'-ה' 09:00-18:00</span>
                    </p>
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
