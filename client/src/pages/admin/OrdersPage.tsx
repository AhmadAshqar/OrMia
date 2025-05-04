import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { format } from "date-fns";
import { he } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  FileText, 
  Check,
  Truck, 
  Package, 
  ShoppingBag,
  Clock,
  X,
  AlertTriangle,
  Eye,
  Printer
} from "lucide-react";

// Mock order status for the UI
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  items: {
    productId: number;
    productName: string;
    quantity: number;
    price: number;
  }[];
  shippingAddress: {
    address: string;
    city: string;
    zipCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // This is a placeholder for real API data
  // In a real implementation, you would connect to your backend API
  const mockOrders: Order[] = [
    {
      id: 1,
      orderNumber: "ORD-001-2023",
      customerName: "דוד כהן",
      customerEmail: "david@example.com",
      total: 1299,
      status: "pending",
      items: [
        {
          productId: 1,
          productName: "טבעת אירוסין מוסאנייט 1.5 קראט",
          quantity: 1,
          price: 1299
        }
      ],
      shippingAddress: {
        address: "רחוב הרצל 15",
        city: "תל אביב",
        zipCode: "6120201"
      },
      createdAt: "2023-05-01T10:30:00Z",
      updatedAt: "2023-05-01T10:30:00Z"
    },
    {
      id: 2,
      orderNumber: "ORD-002-2023",
      customerName: "שרה לוי",
      customerEmail: "sara@example.com",
      total: 2499,
      status: "processing",
      items: [
        {
          productId: 2,
          productName: "עגילי מוסאנייט 1 קראט",
          quantity: 1,
          price: 999
        },
        {
          productId: 3,
          productName: "שרשרת מוסאנייט פנדנט",
          quantity: 1,
          price: 1500
        }
      ],
      shippingAddress: {
        address: "רחוב ביאליק 8",
        city: "חיפה",
        zipCode: "3104201"
      },
      createdAt: "2023-05-05T14:20:00Z",
      updatedAt: "2023-05-06T09:15:00Z"
    },
    {
      id: 3,
      orderNumber: "ORD-003-2023",
      customerName: "מיכאל אברהם",
      customerEmail: "michael@example.com",
      total: 4999,
      status: "shipped",
      items: [
        {
          productId: 4,
          productName: "סט תכשיטי מוסאנייט לכלה",
          quantity: 1,
          price: 4999
        }
      ],
      shippingAddress: {
        address: "שדרות בן גוריון 25",
        city: "ירושלים",
        zipCode: "9438615"
      },
      createdAt: "2023-05-10T11:45:00Z",
      updatedAt: "2023-05-12T16:30:00Z"
    },
    {
      id: 4,
      orderNumber: "ORD-004-2023",
      customerName: "רחל גרין",
      customerEmail: "rachel@example.com",
      total: 899,
      status: "delivered",
      items: [
        {
          productId: 5,
          productName: "צמיד מוסאנייט עדין",
          quantity: 1,
          price: 899
        }
      ],
      shippingAddress: {
        address: "רחוב הדקל 3",
        city: "אשדוד",
        zipCode: "7752003"
      },
      createdAt: "2023-05-15T09:10:00Z",
      updatedAt: "2023-05-18T12:20:00Z"
    },
    {
      id: 5,
      orderNumber: "ORD-005-2023",
      customerName: "יעקב שטיין",
      customerEmail: "yaakov@example.com",
      total: 1799,
      status: "cancelled",
      items: [
        {
          productId: 6,
          productName: "טבעת נישואין מוסאנייט",
          quantity: 1,
          price: 1799
        }
      ],
      shippingAddress: {
        address: "רחוב רוטשילד 22",
        city: "ראשון לציון",
        zipCode: "7525214"
      },
      createdAt: "2023-05-20T16:40:00Z",
      updatedAt: "2023-05-21T10:15:00Z"
    }
  ];

  // Filter orders based on search term
  const filteredOrders = mockOrders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      order.customerEmail.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">ממתין לאישור</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">בטיפול</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">נשלח</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">נמסר</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">בוטל</Badge>;
      default:
        return <Badge variant="outline">לא ידוע</Badge>;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: he });
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(price);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  // In a real implementation, you would connect to your backend API for these actions
  const handleUpdateStatus = (orderId: number, newStatus: OrderStatus) => {
    toast({
      title: "סטטוס הזמנה עודכן",
      description: `סטטוס ההזמנה עודכן ל${getStatusText(newStatus)}`,
    });
    setViewDialogOpen(false);
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'ממתין לאישור';
      case 'processing': return 'בטיפול';
      case 'shipped': return 'נשלח';
      case 'delivered': return 'נמסר';
      case 'cancelled': return 'בוטל';
      default: return 'לא ידוע';
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול הזמנות</h1>
        <Button onClick={() => window.print()}>
          <Printer className="ml-2 h-5 w-5" />
          הדפס רשימת הזמנות
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center border rounded-lg px-3 py-2 max-w-md">
            <Search className="h-5 w-5 text-muted-foreground ml-2" />
            <Input 
              placeholder="חפש לפי מספר הזמנה, שם לקוח או אימייל"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">רשימת הזמנות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מספר הזמנה</TableHead>
                  <TableHead>לקוח</TableHead>
                  <TableHead>תאריך</TableHead>
                  <TableHead className="text-center">סטטוס</TableHead>
                  <TableHead className="text-left">סכום</TableHead>
                  <TableHead className="text-center">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div>{order.customerName}</div>
                          <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(order.status)}
                          {getStatusBadge(order.status)}
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        {formatPrice(order.total)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-3"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          צפה בפרטים
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      {searchTerm ? 'לא נמצאו תוצאות לחיפוש' : 'לא נמצאו הזמנות'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>פרטי הזמנה</DialogTitle>
            <DialogDescription>
              צפייה ועריכת פרטי הזמנה
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="py-4">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">פרטי הזמנה #{selectedOrder.orderNumber}</h3>
                    <div>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">תאריך יצירה</p>
                      <p>{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">עדכון אחרון</p>
                      <p>{formatDate(selectedOrder.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">שם לקוח</p>
                      <p>{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">אימייל</p>
                      <p>{selectedOrder.customerEmail}</p>
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-2">כתובת למשלוח</h4>
                  <div className="p-3 bg-muted rounded-md mb-6">
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.zipCode}</p>
                  </div>
                  
                  <h4 className="font-medium mb-2">עדכון סטטוס</h4>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Button 
                      variant={selectedOrder.status === 'pending' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'pending')}
                    >
                      <Clock className="ml-1 h-4 w-4" />
                      ממתין לאישור
                    </Button>
                    <Button 
                      variant={selectedOrder.status === 'processing' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                    >
                      <Package className="ml-1 h-4 w-4" />
                      בטיפול
                    </Button>
                    <Button 
                      variant={selectedOrder.status === 'shipped' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                    >
                      <Truck className="ml-1 h-4 w-4" />
                      נשלח
                    </Button>
                    <Button 
                      variant={selectedOrder.status === 'delivered' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                    >
                      <Check className="ml-1 h-4 w-4" />
                      נמסר
                    </Button>
                    <Button 
                      variant={selectedOrder.status === 'cancelled' ? 'destructive' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                    >
                      <X className="ml-1 h-4 w-4" />
                      בוטל
                    </Button>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4">פרטי פריטים</h3>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>מוצר</TableHead>
                          <TableHead className="text-center">כמות</TableHead>
                          <TableHead className="text-left">מחיר</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-sm text-muted-foreground">מזהה: {item.productId}</div>
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-left">{formatPrice(item.price)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">סה"כ:</span>
                      <span className="font-bold text-lg">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setViewDialogOpen(false)}
                  className="ml-2"
                >
                  סגור
                </Button>
                <Button 
                  variant="default"
                  onClick={() => window.print()}
                >
                  <Printer className="ml-2 h-4 w-4" />
                  הדפס הזמנה
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}