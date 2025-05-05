import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  Printer,
  FilterIcon
} from "lucide-react";

// Order status types for the UI
type OrderStatus = 'new' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10; // Number of orders to display per page

  // Fetch orders from API
  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['/api/admin/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return await response.json();
    }
  });

  // Filter orders based on search term and status
  const filteredOrders = orders.filter((order: Order) => {
    // First filter by status if a specific status is selected
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false;
    }
    
    // Then filter by search term
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customerName.toLowerCase().includes(searchLower) ||
      order.customerEmail.toLowerCase().includes(searchLower)
    );
  });
  
  // Calculate pagination
  const totalOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalOrders / ordersPerPage);
  
  // Get current orders for the page
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">חדש</Badge>;
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
      case 'new':
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
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

  // Format price - divide by 100 to convert cents to shekels
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(price / 100);
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  // Update order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/orders/${orderId}/status`, { status });
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      return await response.json();
    },
    onSuccess: () => {
      // Refetch the orders data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setViewDialogOpen(false);
      toast({
        title: "סטטוס הזמנה עודכן",
        description: "סטטוס ההזמנה עודכן בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון סטטוס",
        description: `שגיאה: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleUpdateStatus = (orderId: number, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'חדש';
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
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center border rounded-lg px-3 py-2 md:max-w-sm flex-1">
              <Search className="h-5 w-5 text-muted-foreground ml-2" />
              <Input 
                placeholder="חפש לפי מספר הזמנה, שם לקוח או אימייל"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="סנן לפי סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="new">חדש</SelectItem>
                  <SelectItem value="pending">ממתין לאישור</SelectItem>
                  <SelectItem value="processing">בטיפול</SelectItem>
                  <SelectItem value="shipped">נשלח</SelectItem>
                  <SelectItem value="delivered">נמסר</SelectItem>
                  <SelectItem value="cancelled">בוטל</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                {currentOrders.length > 0 ? (
                  currentOrders.map((order: Order) => (
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
                      {searchTerm || statusFilter !== 'all' ? 'לא נמצאו תוצאות לחיפוש' : 'לא נמצאו הזמנות'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const pageNum = index + 1;
                    // Show first page, last page, and pages around current page
                    if (
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            isActive={currentPage === pageNum}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    // Show ellipsis for breaks in sequence
                    if (
                      (pageNum === 2 && currentPage > 3) || 
                      (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
          
          {/* Order stats */}
          <div className="mt-4 text-sm text-muted-foreground text-center">
            מציג {currentOrders.length > 0 ? `${indexOfFirstOrder + 1}-${Math.min(indexOfLastOrder, totalOrders)}` : '0'} מתוך {totalOrders} הזמנות
            {statusFilter !== 'all' && ` • מסונן לפי סטטוס: ${getStatusText(statusFilter as OrderStatus)}`}
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
                      variant={selectedOrder.status === 'new' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'new')}
                    >
                      <ShoppingBag className="ml-1 h-4 w-4" />
                      חדש
                    </Button>
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