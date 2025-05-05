import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Truck, Package, CheckCircle, XCircle, AlertCircle, Clock, Calendar, ClipboardList, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import MainLayout from "@/components/layout/MainLayout";

// Helper functions to format data
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  
  // Format: DD/MM/YYYY
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

// Status mapping for displaying the current shipping status
const shippingStatusMap: Record<string, { color: string; icon: React.ReactNode; text: string }> = {
  pending: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: <Clock className="h-4 w-4 mr-1" />,
    text: "ממתין לאישור"
  },
  processing: {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    icon: <Package className="h-4 w-4 mr-1" />,
    text: "בהכנה למשלוח"
  },
  shipped: {
    color: "bg-purple-100 text-purple-800 border-purple-300",
    icon: <Truck className="h-4 w-4 mr-1" />,
    text: "נשלח"
  },
  delivered: {
    color: "bg-green-100 text-green-800 border-green-300",
    icon: <CheckCircle className="h-4 w-4 mr-1" />,
    text: "נמסר"
  },
  cancelled: {
    color: "bg-red-100 text-red-800 border-red-300",
    icon: <XCircle className="h-4 w-4 mr-1" />,
    text: "בוטל"
  },
  default: {
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: <AlertCircle className="h-4 w-4 mr-1" />,
    text: "לא ידוע"
  }
};

// Component to display shipping history
const ShippingHistory = ({ history }: { history?: { status: string; location: string; timestamp: string; notes?: string }[] }) => {
  if (!history || history.length === 0) {
    return <p className="text-gray-500 text-center py-3">אין היסטוריית משלוח זמינה</p>;
  }

  return (
    <div className="space-y-4 pt-2 text-right">
      {history.map((entry, index) => (
        <div key={index} className="flex flex-col space-y-1 border-r-2 border-gradient-to-r from-gold-300 to-gold-600 pr-4 pb-4 relative">
          <div 
            className="absolute right-[-9px] top-0 w-4 h-4 rounded-full bg-gradient-to-r from-gold-300 to-gold-600"
            style={{ boxShadow: "0 0 10px rgba(218, 165, 32, 0.5)" }}
          />
          <p className="text-sm text-gray-500 font-medium">{formatDate(entry.timestamp)}</p>
          <div className="flex flex-row-reverse items-center">
            {shippingStatusMap[entry.status]?.icon || shippingStatusMap.default.icon}
            <span className="font-medium mr-1">{shippingStatusMap[entry.status]?.text || entry.status}</span>
          </div>
          <p className="text-gray-700">מיקום: {entry.location}</p>
          {entry.notes && <p className="text-gray-500 text-sm">{entry.notes}</p>}
        </div>
      ))}
    </div>
  );
};

// Order detail component with shipping information
const OrderDetail = ({ orderId }: { orderId: number }) => {
  const { toast } = useToast();
  const { data: order, isLoading, error } = useQuery({
    queryKey: ["/api/user/orders", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/user/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("נכשל בטעינת פרטי ההזמנה");
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
        <p className="text-red-600">אירעה שגיאה בטעינת פרטי ההזמנה</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2"
          onClick={() => toast({
            title: "שגיאה",
            description: error instanceof Error ? error.message : "שגיאה לא ידועה",
            variant: "destructive"
          })}
        >
          הצג פרטי שגיאה
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
        <p className="text-amber-600">לא נמצאו פרטים להזמנה זו</p>
      </div>
    );
  }

  // Get estimated delivery date if available
  const estimatedDeliveryDate = order.shipping?.estimatedDelivery 
    ? formatDate(order.shipping.estimatedDelivery) 
    : "לא ידוע";

  return (
    <div className="space-y-6 pt-2 dir-rtl">
      {/* Order items list */}
      <div className="space-y-2">
        <h3 className="text-md font-medium text-right">פריטים בהזמנה</h3>
        <div className="rounded-md overflow-hidden border border-gray-200">
          {order.items?.map((item: any, index: number) => (
            <div key={index} className="flex items-center p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={item.imageUrl || '/placeholder-product.png'} 
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-grow px-3 text-right">
                <div className="font-medium">{item.productName}</div>
                <div className="text-sm text-gray-500">כמות: {item.quantity}</div>
              </div>
              <div className="font-medium text-right">
                ₪{(item.price / 100).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order summary - price breakdown */}
      <div className="rounded-md border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 p-3 border-b">
          <h3 className="font-medium text-right">סיכום הזמנה</h3>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">₪{(order.subtotal / 100).toLocaleString()}</span>
            <span className="text-gray-600">סכום ביניים</span>
          </div>
          
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>-₪{(order.discount / 100).toLocaleString()}</span>
              <span>הנחה</span>
            </div>
          )}
          
          {order.shipping && (
            <div className="flex justify-between">
              <span>₪{(order.shipping.shippingCost / 100).toLocaleString()}</span>
              <span className="text-gray-600">דמי משלוח</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold pt-2 border-t">
            <span>₪{(order.total / 100).toLocaleString()}</span>
            <span>סה״כ</span>
          </div>
        </div>
      </div>

      {/* Shipping info and tracking */}
      {order.shipping && (
        <div className="rounded-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 p-3 border-b">
            <h3 className="font-medium text-right">פרטי משלוח</h3>
          </div>
          <div className="p-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{order.shipping.carrier}</span>
              <span className="text-gray-600">חברת שילוח:</span>
            </div>
            
            <div className="flex justify-between">
              <span>{order.shipping.trackingNumber}</span>
              <span className="text-gray-600">מס׳ מעקב:</span>
            </div>
            
            <div className="flex justify-between">
              <span>{estimatedDeliveryDate}</span>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 ml-1" />
                <span className="text-gray-600">תאריך אספקה משוער:</span>
              </div>
            </div>
            
            <div className="pt-2">
              <div className="text-gray-600 text-right mb-2">כתובת למשלוח:</div>
              <div className="text-right bg-gray-50 p-2 rounded">
                <p>{order.shipping.address.street}, {order.shipping.address.city}</p>
                <p>{order.shipping.address.zipCode}</p>
                <p>טלפון: {order.shipping.address.phone}</p>
              </div>
            </div>

            <div className="pt-2">
              <div className="text-gray-600 text-right mb-2">סטטוס משלוח:</div>
              <ShippingHistory history={order.shipping.history} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MyOrdersPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user, isLoading: isLoadingUser } = useAuth();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
  const {
    data: orders,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/api/user/orders"],
    queryFn: async () => {
      const response = await fetch("/api/user/orders");
      if (!response.ok) {
        throw new Error("נכשל בטעינת ההזמנות");
      }
      return response.json();
    },
    enabled: !!user,
  });

  let content;

  if (isLoadingUser || isLoading) {
    content = (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-right mb-6">
          <h1 className="text-2xl font-bold">ההזמנות שלי</h1>
          <p className="text-gray-600">עקוב אחר ההזמנות וסטטוס המשלוחים שלך</p>
        </div>
        <div className="space-y-4 mt-8">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  } else if (error) {
    content = (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-200">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">שגיאה בטעינת ההזמנות</h2>
          <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : "אירעה שגיאה, אנא נסה שוב מאוחר יותר"}</p>
          <Button onClick={() => setLocation("/")}>חזרה לעמוד הבית</Button>
        </div>
      </div>
    );
  } else if (!user) {
    content = (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-200">
          <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">יש להתחבר כדי לצפות בהזמנות</h2>
          <p className="text-gray-600 mb-4">אנא התחבר כדי לראות את היסטוריית ההזמנות שלך</p>
          <Button onClick={() => setLocation("/auth")}>התחברות</Button>
        </div>
      </div>
    );
  } else if (!orders || orders.length === 0) {
    content = (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-right mb-6">
          <h1 className="text-2xl font-bold">ההזמנות שלי</h1>
          <p className="text-gray-600">עקוב אחר ההזמנות וסטטוס המשלוחים שלך</p>
        </div>
        <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-200">
          <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">אין לך הזמנות עדיין</h2>
          <p className="text-gray-600 mb-4">לא ביצעת הזמנות עדיין. למה לא לגלות את המוצרים שלנו?</p>
          <Button onClick={() => setLocation("/products")}>עבור לחנות</Button>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-right mb-6">
          <h1 className="text-2xl font-bold">ההזמנות שלי</h1>
          <p className="text-gray-600">עקוב אחר ההזמנות וסטטוס המשלוחים שלך</p>
        </div>

        <Tabs defaultValue="all" className="w-full tabs-gold">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">כל ההזמנות</TabsTrigger>
            <TabsTrigger value="active">הזמנות פעילות</TabsTrigger>
            <TabsTrigger value="completed">הזמנות שהושלמו</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id} className="overflow-hidden transition-all">
                  <CardHeader className="p-5 pb-3 flex flex-row-reverse justify-between">
                    <div className="text-right">
                      <CardTitle className="text-lg">הזמנה #{order.orderNumber.split('-').pop()}</CardTitle>
                      <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                    </div>
                    <Badge 
                      className={`${shippingStatusMap[order.shipmentStatus || "default"].color} flex items-center justify-center h-7 px-3`}
                      variant="outline"
                    >
                      {shippingStatusMap[order.shipmentStatus || "default"].icon}
                      {shippingStatusMap[order.shipmentStatus || "default"].text}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center text-gray-500 text-sm">
                        <ClipboardList className="mr-1 h-4 w-4" />
                        <span>{order.items?.length || 0} פריטים</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">סכום כולל:</div>
                        <div className="font-semibold">₪{(order.total / 100).toLocaleString()}</div>
                      </div>
                    </div>

                    <Accordion 
                      type="single" 
                      collapsible 
                      className="w-full"
                      value={selectedOrderId === order.id ? "item-1" : undefined}
                      onValueChange={(value) => setSelectedOrderId(value === "item-1" ? order.id : null)}
                    >
                      <AccordionItem value="item-1" className="border-0">
                        <AccordionTrigger className="pt-4 pb-0">
                          <span className="text-primary text-sm">
                            {selectedOrderId === order.id ? "הסתר פרטים" : "הצג פרטים"}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <OrderDetail orderId={order.id} />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                  <Separator />
                  <CardFooter className="p-4 flex justify-between bg-gray-50">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/support/order/${order.id}`} className="flex items-center">
                        צור קשר בנוגע להזמנה
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    <div className="flex items-center">
                      <Button variant="outline" size="sm" className="mr-2" asChild>
                        <Link href={`/account/orders/${order.id}`}>
                          פרטים מלאים
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="active" className="mt-0">
            <div className="space-y-4">
              {orders
                .filter((order: any) => 
                  ["pending", "processing", "shipped"].includes(order.shipmentStatus))
                .map((order: any) => (
                  <Card key={order.id} className="overflow-hidden transition-all">
                    <CardHeader className="p-5 pb-3 flex flex-row-reverse justify-between">
                      <div className="text-right">
                        <CardTitle className="text-lg">הזמנה #{order.orderNumber.split('-').pop()}</CardTitle>
                        <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                      </div>
                      <Badge 
                        className={`${shippingStatusMap[order.shipmentStatus || "default"].color} flex items-center justify-center h-7 px-3`}
                        variant="outline"
                      >
                        {shippingStatusMap[order.shipmentStatus || "default"].icon}
                        {shippingStatusMap[order.shipmentStatus || "default"].text}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center text-gray-500 text-sm">
                          <ClipboardList className="mr-1 h-4 w-4" />
                          <span>{order.items?.length || 0} פריטים</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">סכום כולל:</div>
                          <div className="font-semibold">₪{(order.total / 100).toLocaleString()}</div>
                        </div>
                      </div>

                      <Accordion 
                        type="single" 
                        collapsible 
                        className="w-full"
                        value={selectedOrderId === order.id ? "item-1" : undefined}
                        onValueChange={(value) => setSelectedOrderId(value === "item-1" ? order.id : null)}
                      >
                        <AccordionItem value="item-1" className="border-0">
                          <AccordionTrigger className="pt-4 pb-0">
                            <span className="text-primary text-sm">
                              {selectedOrderId === order.id ? "הסתר פרטים" : "הצג פרטים"}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <OrderDetail orderId={order.id} />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                    <Separator />
                    <CardFooter className="p-4 flex justify-between bg-gray-50">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/support/order/${order.id}`} className="flex items-center">
                          צור קשר בנוגע להזמנה
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                      <div className="flex items-center">
                        <Button variant="outline" size="sm" className="mr-2" asChild>
                          <Link href={`/account/orders/${order.id}`}>
                            פרטים מלאים
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
                {orders.filter((order: any) => 
                  ["pending", "processing", "shipped"].includes(order.shipmentStatus)).length === 0 && (
                  <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-200">
                    <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">אין הזמנות פעילות</h2>
                    <p className="text-gray-600">כל ההזמנות שלך הושלמו או בוטלו</p>
                  </div>
                )}
            </div>
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            <div className="space-y-4">
              {orders
                .filter((order: any) => 
                  ["delivered", "cancelled"].includes(order.shipmentStatus))
                .map((order: any) => (
                  <Card key={order.id} className="overflow-hidden transition-all">
                    <CardHeader className="p-5 pb-3 flex flex-row-reverse justify-between">
                      <div className="text-right">
                        <CardTitle className="text-lg">הזמנה #{order.orderNumber.split('-').pop()}</CardTitle>
                        <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                      </div>
                      <Badge 
                        className={`${shippingStatusMap[order.shipmentStatus || "default"].color} flex items-center justify-center h-7 px-3`}
                        variant="outline"
                      >
                        {shippingStatusMap[order.shipmentStatus || "default"].icon}
                        {shippingStatusMap[order.shipmentStatus || "default"].text}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center text-gray-500 text-sm">
                          <ClipboardList className="mr-1 h-4 w-4" />
                          <span>{order.items?.length || 0} פריטים</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">סכום כולל:</div>
                          <div className="font-semibold">₪{(order.total / 100).toLocaleString()}</div>
                        </div>
                      </div>

                      <Accordion 
                        type="single" 
                        collapsible 
                        className="w-full"
                        value={selectedOrderId === order.id ? "item-1" : undefined}
                        onValueChange={(value) => setSelectedOrderId(value === "item-1" ? order.id : null)}
                      >
                        <AccordionItem value="item-1" className="border-0">
                          <AccordionTrigger className="pt-4 pb-0">
                            <span className="text-primary text-sm">
                              {selectedOrderId === order.id ? "הסתר פרטים" : "הצג פרטים"}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <OrderDetail orderId={order.id} />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                    <Separator />
                    <CardFooter className="p-4 flex justify-between bg-gray-50">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/support/order/${order.id}`} className="flex items-center">
                          צור קשר בנוגע להזמנה
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                      <div className="flex items-center">
                        <Button variant="outline" size="sm" className="mr-2" asChild>
                          <Link href={`/account/orders/${order.id}`}>
                            פרטים מלאים
                          </Link>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
                {orders.filter((order: any) => 
                  ["delivered", "cancelled"].includes(order.shipmentStatus)).length === 0 && (
                  <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-200">
                    <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">אין הזמנות שהושלמו</h2>
                    <p className="text-gray-600">ההזמנות שלך עדיין בטיפול או במשלוח</p>
                  </div>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <MainLayout>
      {content}
    </MainLayout>
  );
};

export default MyOrdersPage;