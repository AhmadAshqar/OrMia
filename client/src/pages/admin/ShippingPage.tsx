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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Settings,
  BarChart3,
  Calendar
} from "lucide-react";

// Mock shipping data types
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

interface ShippingZone {
  id: number;
  name: string;
  regions: string[];
  methods: {
    id: number;
    name: string;
    price: number;
    estimatedDays: string;
  }[];
}

export default function ShippingPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("shipments");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<ShippingData | null>(null);

  // This is a placeholder for real API data
  // In a real implementation, you would connect to your backend API
  const mockShipments: ShippingData[] = [
    {
      id: 1,
      trackingNumber: "TRACK-001-2023",
      orderNumber: "ORD-001-2023",
      customerName: "דוד כהן",
      shippingMethod: "standard",
      status: "pending",
      address: {
        address: "רחוב הרצל 15",
        city: "תל אביב",
        zipCode: "6120201",
        country: "ישראל"
      },
      history: [
        {
          status: "pending",
          location: "מרכז שילוח",
          timestamp: "2023-05-01T12:30:00Z",
          notes: "ההזמנה התקבלה ומחכה לאריזה"
        }
      ],
      estimatedDelivery: "2023-05-08T00:00:00Z",
      createdAt: "2023-05-01T10:30:00Z",
      updatedAt: "2023-05-01T10:30:00Z"
    },
    {
      id: 2,
      trackingNumber: "TRACK-002-2023",
      orderNumber: "ORD-002-2023",
      customerName: "שרה לוי",
      shippingMethod: "express",
      status: "processing",
      address: {
        address: "רחוב ביאליק 8",
        city: "חיפה",
        zipCode: "3104201",
        country: "ישראל"
      },
      history: [
        {
          status: "pending",
          location: "מרכז שילוח",
          timestamp: "2023-05-05T14:30:00Z",
          notes: "ההזמנה התקבלה"
        },
        {
          status: "processing",
          location: "מרכז שילוח",
          timestamp: "2023-05-06T09:15:00Z",
          notes: "הפריטים נארזים כעת"
        }
      ],
      estimatedDelivery: "2023-05-09T00:00:00Z",
      createdAt: "2023-05-05T14:20:00Z",
      updatedAt: "2023-05-06T09:15:00Z"
    },
    {
      id: 3,
      trackingNumber: "TRACK-003-2023",
      orderNumber: "ORD-003-2023",
      customerName: "מיכאל אברהם",
      shippingMethod: "priority",
      status: "in_transit",
      address: {
        address: "שדרות בן גוריון 25",
        city: "ירושלים",
        zipCode: "9438615",
        country: "ישראל"
      },
      history: [
        {
          status: "pending",
          location: "מרכז שילוח",
          timestamp: "2023-05-10T12:00:00Z"
        },
        {
          status: "processing",
          location: "מרכז שילוח",
          timestamp: "2023-05-11T09:30:00Z"
        },
        {
          status: "in_transit",
          location: "בדרך לירושלים",
          timestamp: "2023-05-12T16:30:00Z",
          notes: "החבילה בדרך ליעד"
        }
      ],
      estimatedDelivery: "2023-05-13T00:00:00Z",
      createdAt: "2023-05-10T11:45:00Z",
      updatedAt: "2023-05-12T16:30:00Z"
    },
    {
      id: 4,
      trackingNumber: "TRACK-004-2023",
      orderNumber: "ORD-004-2023",
      customerName: "רחל גרין",
      shippingMethod: "standard",
      status: "delivered",
      address: {
        address: "רחוב הדקל 3",
        city: "אשדוד",
        zipCode: "7752003",
        country: "ישראל"
      },
      history: [
        {
          status: "pending",
          location: "מרכז שילוח",
          timestamp: "2023-05-15T10:00:00Z"
        },
        {
          status: "processing",
          location: "מרכז שילוח",
          timestamp: "2023-05-16T11:45:00Z"
        },
        {
          status: "in_transit",
          location: "בדרך לאשדוד",
          timestamp: "2023-05-17T08:30:00Z"
        },
        {
          status: "delivered",
          location: "אשדוד",
          timestamp: "2023-05-18T12:20:00Z",
          notes: "החבילה נמסרה ללקוח"
        }
      ],
      estimatedDelivery: "2023-05-19T00:00:00Z",
      createdAt: "2023-05-15T09:10:00Z",
      updatedAt: "2023-05-18T12:20:00Z"
    },
    {
      id: 5,
      trackingNumber: "TRACK-005-2023",
      orderNumber: "ORD-005-2023",
      customerName: "יעקב שטיין",
      shippingMethod: "express",
      status: "failed",
      address: {
        address: "רחוב רוטשילד 22",
        city: "ראשון לציון",
        zipCode: "7525214",
        country: "ישראל"
      },
      history: [
        {
          status: "pending",
          location: "מרכז שילוח",
          timestamp: "2023-05-20T17:00:00Z"
        },
        {
          status: "processing",
          location: "מרכז שילוח",
          timestamp: "2023-05-21T08:30:00Z"
        },
        {
          status: "in_transit",
          location: "בדרך לראשון לציון",
          timestamp: "2023-05-21T13:45:00Z"
        },
        {
          status: "failed",
          location: "ראשון לציון",
          timestamp: "2023-05-21T17:20:00Z",
          notes: "לא ניתן למסור את החבילה - כתובת לא מדויקת"
        }
      ],
      estimatedDelivery: "2023-05-22T00:00:00Z",
      createdAt: "2023-05-20T16:40:00Z",
      updatedAt: "2023-05-21T17:20:00Z"
    }
  ];

  // Mock shipping zones
  const mockShippingZones: ShippingZone[] = [
    {
      id: 1,
      name: "מרכז הארץ",
      regions: ["תל אביב", "רמת גן", "גבעתיים", "חולון", "בת ים", "ראשון לציון", "פתח תקווה"],
      methods: [
        {
          id: 1,
          name: "משלוח רגיל",
          price: 25,
          estimatedDays: "2-3"
        },
        {
          id: 2,
          name: "משלוח מהיר",
          price: 40,
          estimatedDays: "1-2"
        }
      ]
    },
    {
      id: 2,
      name: "צפון הארץ",
      regions: ["חיפה", "קריות", "עכו", "נהריה", "כרמיאל", "טבריה", "צפת"],
      methods: [
        {
          id: 3,
          name: "משלוח רגיל",
          price: 35,
          estimatedDays: "3-5"
        },
        {
          id: 4,
          name: "משלוח מהיר",
          price: 50,
          estimatedDays: "2-3"
        }
      ]
    },
    {
      id: 3,
      name: "דרום הארץ",
      regions: ["באר שבע", "אשדוד", "אשקלון", "קרית גת", "דימונה", "אילת"],
      methods: [
        {
          id: 5,
          name: "משלוח רגיל",
          price: 35,
          estimatedDays: "3-5"
        },
        {
          id: 6,
          name: "משלוח מהיר",
          price: 50,
          estimatedDays: "2-3"
        }
      ]
    },
    {
      id: 4,
      name: "ירושלים והסביבה",
      regions: ["ירושלים", "מודיעין", "בית שמש"],
      methods: [
        {
          id: 7,
          name: "משלוח רגיל",
          price: 30,
          estimatedDays: "2-4"
        },
        {
          id: 8,
          name: "משלוח מהיר",
          price: 45,
          estimatedDays: "1-2"
        }
      ]
    }
  ];

  // Filter shipments based on search term
  const filteredShipments = mockShipments.filter(shipment => {
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

  // In a real implementation, you would connect to your backend API for these actions
  const handleUpdateStatus = (shipmentId: number, newStatus: ShippingStatus) => {
    toast({
      title: "סטטוס משלוח עודכן",
      description: `סטטוס המשלוח עודכן ל${getStatusText(newStatus)}`,
    });
    setViewDialogOpen(false);
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shipments">משלוחים פעילים</TabsTrigger>
          <TabsTrigger value="zones">אזורי משלוח ותעריפים</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shipments" className="mt-6">
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
                    {filteredShipments.length > 0 ? (
                      filteredShipments.map((shipment) => (
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
        </TabsContent>

        <TabsContent value="zones" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">אזורי משלוח ותעריפים</CardTitle>
              <CardDescription>הגדרת אזורי משלוח ועלויות משלוח לכל אזור</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {mockShippingZones.map((zone) => (
                  <Card key={zone.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{zone.name}</CardTitle>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4 ml-2" />
                          ערוך
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2 text-sm text-muted-foreground">ערים ואזורים</h4>
                          <div className="flex flex-wrap gap-2">
                            {zone.regions.map((region, index) => (
                              <Badge key={index} variant="outline" className="bg-muted/50">
                                <MapPin className="h-3 w-3 ml-1" />
                                {region}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 text-sm text-muted-foreground">שיטות משלוח</h4>
                          <div className="space-y-3">
                            {zone.methods.map((method) => (
                              <div key={method.id} className="flex justify-between p-2 border rounded-md bg-card">
                                <div>
                                  <div className="font-medium">{method.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    <Calendar className="inline-block h-3 w-3 ml-1" />
                                    זמן משלוח משוער: {method.estimatedDays} ימי עסקים
                                  </div>
                                </div>
                                <div className="font-bold">
                                  {method.price} ₪
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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