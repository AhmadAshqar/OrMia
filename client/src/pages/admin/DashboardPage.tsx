import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Inventory, Order, Product } from "@shared/schema";
import { BarChart3, Package, ShoppingBag, AlertTriangle, TrendingUp, Calendar, Loader2, Box } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface OrdersByDay {
  date: string;
  count: number;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [lowStockItems, setLowStockItems] = useState<(Inventory & {product?: Product})[]>([]);
  const [packagingOrders, setPackagingOrders] = useState<number>(0);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Fetch inventory
  const { data: inventory, isLoading: inventoryLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/admin/inventory"],
  });
  
  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
  });
  
  // Fetch orders by day for chart
  const { data: ordersByDay, isLoading: ordersChartLoading } = useQuery<OrdersByDay[]>({
    queryKey: ["/api/admin/orders/stats/by-day"],
  });

  useEffect(() => {
    if (inventory && products) {
      // Find items with low stock
      const lowStock = inventory
        .filter((item: Inventory) => item.quantity <= (item.minimumStockLevel || 5))
        .map((item: Inventory) => {
          const product = products.find(p => p.id === item.productId);
          return { ...item, product };
        });
      
      setLowStockItems(lowStock);
    }
  }, [inventory, products]);

  // Count orders with "באריזה" (packaging) status
  useEffect(() => {
    if (orders) {
      const packagingOrdersCount = orders.filter(order => order.shipmentStatus === "באריזה").length;
      setPackagingOrders(packagingOrdersCount);
    }
  }, [orders]);

  const isLoading = productsLoading || inventoryLoading || ordersChartLoading || ordersLoading;

  // Calculate current month's order count
  const getCurrentMonthOrderCount = (): number => {
    if (!ordersByDay) return 0;
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return ordersByDay.reduce((total, dayData) => {
      const orderDate = new Date(dayData.date);
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        return total + dayData.count;
      }
      return total;
    }, 0);
  };

  // Dashboard stats
  const stats = [
    {
      title: "הזמנות החודש",
      value: getCurrentMonthOrderCount(),
      icon: <BarChart3 className="h-8 w-8 text-red-500" />,
      color: "bg-red-100 dark:bg-red-900/20",
    },
    {
      title: "משלוחים ממתינים לשליח",
      value: packagingOrders,
      icon: <Box className="h-8 w-8 text-green-500" />,
      color: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "מוצרים במלאי",
      value: inventory ? inventory.reduce((total: number, item: Inventory) => 
        total + item.quantity, 0) : 0,
      icon: <Package className="h-8 w-8 text-blue-500" />,
      color: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "פריטים במלאי נמוך",
      value: lowStockItems.length,
      icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
      color: "bg-amber-100 dark:bg-amber-900/20",
    }
  ];

  const getTodayDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    };
    return today.toLocaleDateString('he-IL', options);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">לוח בקרה</h1>
        <div className="flex items-center text-muted-foreground">
          <Calendar className="ml-2 h-5 w-5" /> 
          <span>{getTodayDate()}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">הזמנות בחודש האחרון</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersChartLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : ordersByDay && ordersByDay.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={ordersByDay}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#FFD700" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => {
                      const [year, month, day] = value.split('-');
                      return `${day}/${month}`;
                    }}
                  />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '0.5rem' }}
                    labelFormatter={(value) => {
                      const [year, month, day] = value.split('-');
                      return `תאריך: ${day}/${month}/${year}`;
                    }}
                    formatter={(value) => [`${value} הזמנות`, '']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#FFD700" 
                    fillOpacity={1} 
                    fill="url(#colorOrders)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>אין נתוני הזמנות להצגה</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">פריטים במלאי נמוך</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.product?.name || `מוצר #${item.productId}`}</h4>
                      <p className="text-sm text-muted-foreground">מק"ט: {item.product?.sku || 'לא ידוע'}</p>
                    </div>
                    <div className="flex items-center">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.quantity === 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.quantity === 0 ? 'אזל מהמלאי' : `נותרו ${item.quantity} יח'`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>כל הפריטים במלאי תקין</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">משלוחים בדרך</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              </div>
            ) : inventory && inventory.some((item: Inventory) => (item.onOrder || 0) > 0) ? (
              <div className="space-y-4">
                {inventory
                  .filter((item: Inventory) => (item.onOrder || 0) > 0)
                  .map((item: Inventory) => {
                    const product = products?.find(p => p.id === item.productId);
                    const expectedDate = item.expectedDelivery 
                      ? new Date(item.expectedDelivery).toLocaleDateString('he-IL')
                      : 'חדש';
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{product?.name || `מוצר #${item.productId}`}</h4>
                          <p className="text-sm text-muted-foreground">
                            צפי הגעה: {expectedDate}
                          </p>
                        </div>
                        <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {item.onOrder} יח' בדרך
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>אין משלוחים בדרך כרגע</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}