import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CartItem } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Form schema
const checkoutSchema = z.object({
  firstName: z.string().min(2, { message: "שם פרטי חייב להכיל לפחות 2 תווים" }),
  lastName: z.string().min(2, { message: "שם משפחה חייב להכיל לפחות 2 תווים" }),
  email: z.string().email({ message: "כתובת אימייל אינה תקינה" }),
  phone: z.string().min(9, { message: "מספר טלפון אינו תקין" }),
  address: z.string().min(5, { message: "כתובת חייבת להכיל לפחות 5 תווים" }),
  city: z.string().min(2, { message: "עיר חייבת להכיל לפחות 2 תווים" }),
  zip: z.string().min(5, { message: "מיקוד אינו תקין" }),
  notes: z.string().optional(),
  saveInfo: z.boolean().optional(),
  paymentMethod: z.enum(["credit-card", "paypal", "bank-transfer"], {
    required_error: "אנא בחר שיטת תשלום",
  }),
  terms: z.literal(true, {
    errorMap: () => ({ message: "עליך להסכים לתנאי השימוש כדי להמשיך" }),
  }),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Get cart items
  const { data: cartItems, isLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/cart'],
  });

  // Form
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      zip: "",
      notes: "",
      saveInfo: false,
      paymentMethod: "credit-card",
      terms: false,
    },
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    if (!cartItems || cartItems.length === 0) {
      toast({
        title: "סל קניות ריק",
        description: "לא ניתן להשלים הזמנה עם סל קניות ריק",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit order to backend
      await apiRequest('POST', '/api/orders', {
        ...data,
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.discountPrice || item.product.price
        }))
      });

      // Clear cart
      await apiRequest('DELETE', '/api/cart', {});
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });

      // Show success message
      toast({
        title: "ההזמנה התקבלה!",
        description: "ההזמנה שלך התקבלה בהצלחה. אימייל אישור יישלח אליך בקרוב.",
      });

      // Redirect to success page (could be created as a separate page)
      setLocation("/");
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בעת עיבוד ההזמנה. אנא נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const calculateSubtotal = () => {
    if (!cartItems) return 0;
    return cartItems.reduce((sum, item) => {
      return sum + (item.product.discountPrice || item.product.price) * item.quantity;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const shipping = subtotal >= 1000 ? 0 : 50;
  const total = subtotal + shipping;

  // If cart is empty, redirect to cart page
  if (!isLoading && (!cartItems || cartItems.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-serif mb-4">סל הקניות ריק</h1>
        <p className="mb-6">לא ניתן להמשיך לתשלום כאשר סל הקניות ריק.</p>
        <Button asChild>
          <Link href="/category/all">המשך בקנייה</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif mb-8">תשלום</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Checkout form */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="bg-white p-6 border rounded-md shadow-sm">
                <h2 className="text-xl font-medium mb-6">פרטי לקוח</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
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
                    name="lastName"
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
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>אימייל</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
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
                        <FormLabel>טלפון</FormLabel>
                        <FormControl>
                          <Input type="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="bg-white p-6 border rounded-md shadow-sm">
                <h2 className="text-xl font-medium mb-6">פרטי משלוח</h2>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="address"
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
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
                      name="zip"
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>הערות להזמנה (אופציונלי)</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="saveInfo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            שמור את המידע שלי לפעם הבאה
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="bg-white p-6 border rounded-md shadow-sm">
                <h2 className="text-xl font-medium mb-6">אמצעי תשלום</h2>
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="space-y-3"
                        >
                          <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                            <FormControl>
                              <RadioGroupItem value="credit-card" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              כרטיס אשראי
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                            <FormControl>
                              <RadioGroupItem value="paypal" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              PayPal
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-x-reverse space-y-0">
                            <FormControl>
                              <RadioGroupItem value="bank-transfer" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              העברה בנקאית
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Credit card form will be shown conditionally based on selected payment method */}
                {form.watch("paymentMethod") === "credit-card" && (
                  <div className="mt-6 p-4 border rounded bg-gray-50">
                    <p className="text-center text-gray-500">
                      פרטי כרטיס האשראי יוזנו בעמוד הבא
                    </p>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        קראתי ואני מסכים/ה ל<Link href="/terms" className="text-[hsl(var(--gold))]">תנאי השימוש</Link> ול<Link href="/privacy" className="text-[hsl(var(--gold))]">מדיניות הפרטיות</Link>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-dark))] text-black py-6 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "מעבד הזמנה..." : "השלם הזמנה"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 p-6 border rounded-md sticky top-24">
            <h2 className="text-xl font-medium mb-6">סיכום הזמנה</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cartItems?.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <span className="font-medium">{item.product.name}</span>
                        <span className="text-gray-500"> x{item.quantity}</span>
                      </div>
                      <span>
                        ₪{((item.product.discountPrice || item.product.price) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>סה"כ ביניים:</span>
                    <span>₪{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>משלוח:</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-[hsl(var(--gold))]">חינם</span>
                      ) : (
                        <span>₪{shipping.toLocaleString()}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-gray-200">
                    <span>סה"כ:</span>
                    <span>₪{total.toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
