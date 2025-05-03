import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Inventory, Product } from "@shared/schema";
import { BarChart3, Package, ShoppingBag, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

export default function DashboardPage() {
  const { toast } = useToast();
  const [lowStockItems, setLowStockItems] = useState<(Inventory & {product?: Product})[]>([]);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Fetch inventory
  const { data: inventory, isLoading: inventoryLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/admin/inventory"],
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

  const isLoading = productsLoading || inventoryLoading;

  // Dashboard stats
  const stats = [
    {
      title: "מוצרים במלאי",
      value: inventory ? inventory.reduce((total: number, item: Inventory) => 
        total + item.quantity, 0) : 0,
      icon: <Package className="h-8 w-8 text-blue-500" />,
      color: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "מוצרים ייחודיים",
      value: products?.length || 0,
      icon: <ShoppingBag className="h-8 w-8 text-purple-500" />,
      color: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "פריטים במלאי נמוך",
      value: lowStockItems.length,
      icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
      color: "bg-amber-100 dark:bg-amber-900/20",
    },
    {
      title: "מוצרים בדרך",
      value: inventory ? inventory.reduce((total: number, item: Inventory) => 
        total + (item.onOrder || 0), 0) : 0,
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
      color: "bg-green-100 dark:bg-green-900/20",
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
                      : 'לא ידוע';
                    
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