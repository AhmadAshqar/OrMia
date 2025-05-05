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
  new: {
    color: "bg-blue-50 text-blue-600 border-blue-200",
    icon: <ShoppingBag className="h-4 w-4 mr-1" />,
    text: "חדש"
  },
  cancelled: {
    color: "bg-red-100 text-red-800 border-red-300",
    icon: <XCircle className="h-4 w-4 mr-1" />,
    text: "בוטל"
  },
  failed: {
    color: "bg-red-100 text-red-800 border-red-300", 
    icon: <XCircle className="h-4 w-4 mr-1" />,
    text: "נכשל"
  },
  default: {
    color: "bg-gray-100 text-gray-800 border-gray-300",
    icon: <AlertCircle className="h-4 w-4 mr-1" />,
    text: "לא ידוע"
  }
};

// Helper function to safely get shipping status styling
const getShippingStatus = (status: string | undefined | null) => {
  if (!status || !shippingStatusMap[status]) {
    return {
      color: shippingStatusMap.default.color,
      icon: shippingStatusMap.default.icon,
      text: shippingStatusMap.default.text
    };
  }
  return {
    color: shippingStatusMap[status].color,
    icon: shippingStatusMap[status].icon,
    text: shippingStatusMap[status].text
  };
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
            {getShippingStatus(entry.status).icon}
            <span className="font-medium mr-1">{getShippingStatus(entry.status).text}</span>
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
      // Add timestamp to prevent caching
      const response = await fetch(`/api/user/orders/${orderId}?t=${Date.now()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "שגיאה בטעינת פרטי ההזמנה");
      }
      return response.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    toast({
      variant: "destructive",
      title: "שגיאה בטעינת פרטי ההזמנה",
      description: error instanceof Error ? error.message : "אירעה שגיאה. אנא נסה שוב מאוחר יותר."
    });
    return <div className="text-red-500 p-4 text-center">שגיאה בטעינת פרטי ההזמנה</div>;
  }

  const shipping = order.shipping && order.shipping.length > 0 ? order.shipping[0] : null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-right">פרטי המשלוח</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
          <div>
            <p className="text-gray-500 mb-1">מספר מעקב:</p>
            <p className="font-medium">{shipping?.trackingNumber || "לא זמין"}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">חברת שליחות:</p>
            <p className="font-medium">{shipping?.carrierName || "לא צוין"}</p>
          </div>
          {shipping?.estimatedDelivery && (
            <div>
              <p className="text-gray-500 mb-1">תאריך אספקה משוער:</p>
              <p className="font-medium">{formatDate(shipping.estimatedDelivery)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500 mb-1">סטטוס משלוח:</p>
            <Badge 
              className={`${getShippingStatus(shipping?.status).color} flex items-center justify-center h-7 px-3`}
              variant="outline"
            >
              {getShippingStatus(shipping?.status).icon}
              {getShippingStatus(shipping?.status).text}
            </Badge>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-right">מוצרים בהזמנה</h3>
        <div className="space-y-4">
          {order.items && order.items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
              <div className="flex items-center space-x-4 space-x-reverse flex-row-reverse">
                {item.imageUrl && (
                  <div className="h-12 w-12 rounded-md overflow-hidden">
                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="text-right">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-gray-500">כמות: {item.quantity}</p>
                </div>
              </div>
              <div className="font-medium">₪{(item.price / 100).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
            <Calendar className="h-4 w-4 ml-1" />
            הוסף ליומן
          </button>
          <h3 className="text-xl font-semibold text-right">היסטוריית משלוח</h3>
        </div>
        <ShippingHistory history={shipping?.history} />
      </div>
    </div>
  );
};

// Main MyOrdersPage component
const MyOrdersPage = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ["/api/user/orders"],
    queryFn: async () => {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/user/orders?t=${Date.now()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "שגיאה בטעינת ההזמנות");
      }
      const data = await response.json();
      console.log("Orders data:", data);
      if (data && data.length > 0) {
        console.log("First order shipmentStatus:", data[0].shipmentStatus);
        console.log("ShippingStatusMap keys:", Object.keys(shippingStatusMap));
      }
      return data;
    },
    enabled: !!user, // Only run query if user is logged in
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true // Refetch when window regains focus
  });

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user && !isLoading) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  if (!user) {
    return null; // Render nothing while redirecting
  }

  let content;
  
  if (isLoading) {
    content = (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-right">ההזמנות שלי</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  } else if (error) {
    toast({
      variant: "destructive",
      title: "שגיאה בטעינת ההזמנות",
      description: error instanceof Error ? error.message : "אירעה שגיאה. אנא נסה שוב מאוחר יותר."
    });
    
    content = (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-right">ההזמנות שלי</h1>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">לא ניתן לטעון את ההזמנות שלך</h2>
          <p className="text-gray-600 mb-6">אירעה שגיאה בטעינת ההזמנות שלך. אנא נסה שוב מאוחר יותר.</p>
          <Button onClick={() => window.location.reload()}>נסה שוב</Button>
        </div>
      </div>
    );
  } else if (orders?.length === 0) {
    content = (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-right">ההזמנות שלי</h1>
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">אין לך הזמנות עדיין</h2>
          <p className="text-gray-600 mb-6">התחל לקנות כדי לראות את ההזמנות שלך כאן</p>
          <Button asChild>
            <Link href="/">המשך לקנות</Link>
          </Button>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 text-right">ההזמנות שלי</h1>
        
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-end mb-4">
            <TabsList>
              <TabsTrigger value="all">כל ההזמנות</TabsTrigger>
              <TabsTrigger value="active">בתהליך</TabsTrigger>
              <TabsTrigger value="completed">הושלמו</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="mt-0">
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id} className="overflow-hidden transition-all">
                  <CardHeader className="p-5 pb-3 flex flex-row-reverse justify-between">
                    <div className="text-right">
                      <CardTitle className="text-lg">הזמנה #{order.orderNumber}</CardTitle>
                      <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                    </div>
                    <Badge 
                      className={`${getShippingStatus(order.shipmentStatus).color} flex items-center justify-center h-7 px-3`}
                      variant="outline"
                    >
                      {getShippingStatus(order.shipmentStatus).icon}
                      {getShippingStatus(order.shipmentStatus).text}
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

                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="active" className="mt-0">
            <div className="space-y-4">
              {orders
                .filter((order: any) => 
                  (order.shipmentStatus && ["pending", "processing", "shipped", "new"].includes(order.shipmentStatus)))
                .map((order: any) => (
                  <Card key={order.id} className="overflow-hidden transition-all">
                    <CardHeader className="p-5 pb-3 flex flex-row-reverse justify-between">
                      <div className="text-right">
                        <CardTitle className="text-lg">הזמנה #{order.orderNumber}</CardTitle>
                        <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                      </div>
                      <Badge 
                        className={`${getShippingStatus(order.shipmentStatus).color} flex items-center justify-center h-7 px-3`}
                        variant="outline"
                      >
                        {getShippingStatus(order.shipmentStatus).icon}
                        {getShippingStatus(order.shipmentStatus).text}
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
                    </CardFooter>
                  </Card>
                ))}
                {orders.filter((order: any) => 
                  (order.shipmentStatus && ["pending", "processing", "shipped", "new"].includes(order.shipmentStatus))).length === 0 && (
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
                  ["delivered", "cancelled", "failed"].includes(order.shipmentStatus))
                .map((order: any) => (
                  <Card key={order.id} className="overflow-hidden transition-all">
                    <CardHeader className="p-5 pb-3 flex flex-row-reverse justify-between">
                      <div className="text-right">
                        <CardTitle className="text-lg">הזמנה #{order.orderNumber}</CardTitle>
                        <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                      </div>
                      <Badge 
                        className={`${getShippingStatus(order.shipmentStatus).color} flex items-center justify-center h-7 px-3`}
                        variant="outline"
                      >
                        {getShippingStatus(order.shipmentStatus).icon}
                        {getShippingStatus(order.shipmentStatus).text}
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
                    </CardFooter>
                  </Card>
                ))}
                {orders.filter((order: any) => 
                  (order.shipmentStatus && ["delivered", "cancelled", "failed"].includes(order.shipmentStatus))).length === 0 && (
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