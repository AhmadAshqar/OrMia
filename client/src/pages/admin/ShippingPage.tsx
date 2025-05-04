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
  CardTitle,
  CardDescription
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
  Printer,
  MapPin,
  Calendar
} from "lucide-react";

// Shipping data types
type ShippingStatus = 'pending' | 'processing' | 'in_transit' | 'delivered' | 'failed';
type ShippingMethod = 'standard' | 'express' | 'priority';

interface ShippingData {
  id: number;
  trackingNumber: string;
  orderNumber: string;
  customerName: string;
  shippingMethod: ShippingMethod;
  status: ShippingStatus;
  address: {
    address: string;
    city: string;
    zipCode: string;
    country: string;
  };
  history: {
    status: ShippingStatus;
    location: string;
    timestamp: string;
    notes?: string;
  }[];
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
}

export default function ShippingPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShippingData | null>(null);

  // Fetch shipments from API
  const { data: shipments = [], isLoading, isError } = useQuery({
    queryKey: ['/api/admin/shipping'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/shipping');
      if (!response.ok) {
        throw new Error('Failed to fetch shipping data');
      }
      return await response.json();
    }
  });

  // Filter shipments based on search term
  const filteredShipments = shipments.filter((shipment: ShippingData) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      shipment.trackingNumber.toLowerCase().includes(searchLower) ||
      shipment.orderNumber.toLowerCase().includes(searchLower) ||
      shipment.customerName.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: ShippingStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">ממתין לעיבוד</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">באריזה</Badge>;
      case 'in_transit':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">בדרך</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">נמסר</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">נכשל</Badge>;
      default:
        return <Badge variant="outline">לא ידוע</Badge>;
    }
  };

  const getShippingMethodDisplay = (method: ShippingMethod) => {
    switch (method) {
      case 'standard':
        return <Badge variant="outline" className="bg-muted">משלוח רגיל</Badge>;
      case 'express':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">משלוח מהיר</Badge>;
      case 'priority':
        return <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">משלוח פרימיום</Badge>;
      default:
        return <Badge variant="outline">לא ידוע</Badge>;
    }
  };

  const getStatusIcon = (status: ShippingStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'in_transit':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: he });
  };

  const handleViewShipment = (shipment: ShippingData) => {
    setSelectedShipment(shipment);
    setViewDialogOpen(true);
  };

  // Update shipping status API connection
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: ShippingStatus }) => {
      const response = await apiRequest('PATCH', `/api/admin/shipping/${id}/status`, { status });
      if (!response.ok) {
        throw new Error('Failed to update shipping status');
      }
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch shipping data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shipping'] });
      toast({
        title: "סטטוס משלוח עודכן",
        description: "סטטוס המשלוח עודכן בהצלחה",
      });
      setViewDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון סטטוס",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleUpdateStatus = (shipmentId: number, newStatus: ShippingStatus) => {
    updateStatusMutation.mutate({ id: shipmentId, status: newStatus });
  };

  const getStatusText = (status: ShippingStatus) => {
    switch (status) {
      case 'pending': return 'ממתין לעיבוד';
      case 'processing': return 'באריזה';
      case 'in_transit': return 'בדרך';
      case 'delivered': return 'נמסר';
      case 'failed': return 'נכשל';
      default: return 'לא ידוע';
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול משלוחים</h1>
      </div>

      <div className="mt-6">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center border rounded-lg px-3 py-2 max-w-md">
              <Search className="h-5 w-5 text-muted-foreground ml-2" />
              <Input 
                placeholder="חפש לפי מספר מעקב, מספר הזמנה או שם לקוח"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">משלוחים פעילים</CardTitle>
            <CardDescription>מעקב אחר משלוחים וניהול סטטוס</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>מספר מעקב</TableHead>
                    <TableHead>הזמנה</TableHead>
                    <TableHead>לקוח</TableHead>
                    <TableHead>סוג משלוח</TableHead>
                    <TableHead>תאריך יצירה</TableHead>
                    <TableHead className="text-center">סטטוס</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <div className="flex justify-center">
                          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                        </div>
                        <div className="mt-2 text-muted-foreground">טוען נתוני משלוחים...</div>
                      </TableCell>
                    </TableRow>
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-destructive">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <div>שגיאה בטעינת נתוני משלוחים</div>
                      </TableCell>
                    </TableRow>
                  ) : filteredShipments.length > 0 ? (
                    filteredShipments.map((shipment: ShippingData) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium">{shipment.trackingNumber}</TableCell>
                        <TableCell>{shipment.orderNumber}</TableCell>
                        <TableCell>{shipment.customerName}</TableCell>
                        <TableCell>{getShippingMethodDisplay(shipment.shippingMethod)}</TableCell>
                        <TableCell>{formatDate(shipment.createdAt)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(shipment.status)}
                            {getStatusBadge(shipment.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-3"
                            onClick={() => handleViewShipment(shipment)}
                          >
                            <Eye className="h-4 w-4 ml-2" />
                            פרטים
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        {searchTerm ? 'לא נמצאו תוצאות לחיפוש' : 'לא נמצאו משלוחים פעילים'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Shipment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>פרטי משלוח</DialogTitle>
            <DialogDescription>
              צפייה ועדכון סטטוס משלוח
            </DialogDescription>
          </DialogHeader>
          
          {selectedShipment && (
            <div className="py-4">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">משלוח #{selectedShipment.trackingNumber}</h3>
                    <div>
                      {getStatusBadge(selectedShipment.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">מספר הזמנה</p>
                      <p>{selectedShipment.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">שם לקוח</p>
                      <p>{selectedShipment.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">סוג משלוח</p>
                      <p>{getShippingMethodDisplay(selectedShipment.shippingMethod)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">תאריך משלוח צפוי</p>
                      <p>{formatDate(selectedShipment.estimatedDelivery)}</p>
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-2">כתובת למשלוח</h4>
                  <div className="p-3 bg-muted rounded-md mb-6">
                    <p>{selectedShipment.address.address}</p>
                    <p>{selectedShipment.address.city}, {selectedShipment.address.zipCode}</p>
                    <p>{selectedShipment.address.country}</p>
                  </div>
                  
                  <h4 className="font-medium mb-2">עדכון סטטוס</h4>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Button 
                      variant={selectedShipment.status === 'pending' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'pending')}
                    >
                      <Clock className="ml-1 h-4 w-4" />
                      ממתין לעיבוד
                    </Button>
                    <Button 
                      variant={selectedShipment.status === 'processing' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'processing')}
                    >
                      <Package className="ml-1 h-4 w-4" />
                      באריזה
                    </Button>
                    <Button 
                      variant={selectedShipment.status === 'in_transit' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'in_transit')}
                    >
                      <Truck className="ml-1 h-4 w-4" />
                      בדרך
                    </Button>
                    <Button 
                      variant={selectedShipment.status === 'delivered' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'delivered')}
                    >
                      <Check className="ml-1 h-4 w-4" />
                      נמסר
                    </Button>
                    <Button 
                      variant={selectedShipment.status === 'failed' ? 'destructive' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'failed')}
                    >
                      <X className="ml-1 h-4 w-4" />
                      נכשל
                    </Button>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4">היסטוריית משלוח</h3>
                  <div className="space-y-4">
                    {selectedShipment.history.map((event, index) => (
                      <div key={index} className="flex">
                        <div className="ml-4 flex flex-col items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            {getStatusIcon(event.status as ShippingStatus)}
                          </div>
                          {index < selectedShipment.history.length - 1 && (
                            <div className="w-0.5 h-full bg-muted mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 border rounded-md p-3 bg-card">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {getStatusText(event.status as ShippingStatus)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {event.location}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(event.timestamp)}
                            </p>
                          </div>
                          {event.notes && (
                            <p className="text-sm mt-2 p-2 bg-muted/50 rounded">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
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
                  הדפס פרטי משלוח
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

      {/* View Shipment Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>פרטי משלוח</DialogTitle>
            <DialogDescription>
              צפייה ועדכון סטטוס משלוח
            </DialogDescription>
          </DialogHeader>
          
          {selectedShipment && (
            <div className="py-4">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">משלוח #{selectedShipment.trackingNumber}</h3>
                    <div>
                      {getStatusBadge(selectedShipment.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">מספר הזמנה</p>
                      <p>{selectedShipment.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">שם לקוח</p>
                      <p>{selectedShipment.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">סוג משלוח</p>
                      <p>{getShippingMethodDisplay(selectedShipment.shippingMethod)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">תאריך משלוח צפוי</p>
                      <p>{formatDate(selectedShipment.estimatedDelivery)}</p>
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-2">כתובת למשלוח</h4>
                  <div className="p-3 bg-muted rounded-md mb-6">
                    <p>{selectedShipment.address.address}</p>
                    <p>{selectedShipment.address.city}, {selectedShipment.address.zipCode}</p>
                    <p>{selectedShipment.address.country}</p>
                  </div>
                  
                  <h4 className="font-medium mb-2">עדכון סטטוס</h4>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Button 
                      variant={selectedShipment.status === 'pending' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'pending')}
                    >
                      <Clock className="ml-1 h-4 w-4" />
                      ממתין לעיבוד
                    </Button>
                    <Button 
                      variant={selectedShipment.status === 'processing' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'processing')}
                    >
                      <Package className="ml-1 h-4 w-4" />
                      באריזה
                    </Button>
                    <Button 
                      variant={selectedShipment.status === 'in_transit' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'in_transit')}
                    >
                      <Truck className="ml-1 h-4 w-4" />
                      בדרך
                    </Button>
                    <Button 
                      variant={selectedShipment.status === 'delivered' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'delivered')}
                    >
                      <Check className="ml-1 h-4 w-4" />
                      נמסר
                    </Button>
                    <Button 
                      variant={selectedShipment.status === 'failed' ? 'destructive' : 'outline'} 
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedShipment.id, 'failed')}
                    >
                      <X className="ml-1 h-4 w-4" />
                      נכשל
                    </Button>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4">היסטוריית משלוח</h3>
                  <div className="space-y-4">
                    {selectedShipment.history.map((event, index) => (
                      <div key={index} className="flex">
                        <div className="ml-4 flex flex-col items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            {getStatusIcon(event.status)}
                          </div>
                          {index < selectedShipment.history.length - 1 && (
                            <div className="w-0.5 h-full bg-muted mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 border rounded-md p-3 bg-card">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {getStatusText(event.status)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {event.location}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(event.timestamp)}
                            </p>
                          </div>
                          {event.notes && (
                            <p className="text-sm mt-2 p-2 bg-muted/50 rounded">
                              {event.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
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
                  הדפס פרטי משלוח
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}