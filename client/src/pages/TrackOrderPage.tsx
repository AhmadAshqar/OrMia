import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Truck, Package, CheckCircle, XCircle, AlertCircle, Clock, Search } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";

// Helper function to format date
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
  in_transit: {
    color: "bg-purple-100 text-purple-800 border-purple-300",
    icon: <Truck className="h-4 w-4 mr-1" />,
    text: "בדרך"
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

// Main tracking page component
const TrackOrderPage = () => {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  
  // Use query for tracking
  const { data: tracking, isLoading, refetch, error } = useQuery({
    queryKey: ["/api/tracking", trackingNumber],
    queryFn: async () => {
      if (!trackingNumber.trim()) {
        throw new Error("יש להזין מספר מעקב");
      }
      
      const response = await fetch(`/api/tracking/${trackingNumber.trim()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "לא נמצא מידע עבור מספר המעקב שהוזן");
      }
      
      return response.json();
    },
    enabled: false, // Don't run automatically
    retry: false,
    staleTime: 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      toast({
        variant: "destructive",
        title: "שגיאה",
        description: "יש להזין מספר מעקב",
      });
      return;
    }
    
    setHasSearched(true);
    refetch();
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-6 text-center">מעקב אחר הזמנה</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-right">הזן מספר מעקב</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2 text-right">
                  <Label htmlFor="trackingNumber">מספר מעקב</Label>
                  <div className="flex">
                    <Input
                      id="trackingNumber"
                      type="text"
                      placeholder="הזן מספר מעקב"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="flex-1 text-right"
                      dir="rtl"
                    />
                    <Button type="submit" className="mr-2" disabled={isLoading}>
                      {isLoading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      <span className="mr-2">חפש</span>
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results section */}
        {hasSearched && (
          <>
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card className="border-red-200">
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                    <h2 className="text-xl font-semibold mb-2">לא נמצא משלוח</h2>
                    <p className="text-gray-600">
                      {error instanceof Error ? error.message : "לא נמצא מידע עבור מספר המעקב שהוזן"}.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : tracking ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <Badge 
                        className={`${shippingStatusMap[tracking.status || "default"].color} flex items-center justify-center h-7 px-3`}
                        variant="outline"
                      >
                        {shippingStatusMap[tracking.status || "default"].icon}
                        {shippingStatusMap[tracking.status || "default"].text}
                      </Badge>
                      <CardTitle className="text-xl text-right">פרטי משלוח #{tracking.trackingNumber}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right mb-6">
                      <div>
                        <p className="text-gray-500 mb-1">מספר מעקב:</p>
                        <p className="font-medium">{tracking.trackingNumber}</p>
                      </div>
                      {tracking.orderNumber && (
                        <div>
                          <p className="text-gray-500 mb-1">מספר הזמנה:</p>
                          <p className="font-medium">{tracking.orderNumber}</p>
                        </div>
                      )}
                      {tracking.estimatedDelivery && (
                        <div>
                          <p className="text-gray-500 mb-1">תאריך אספקה משוער:</p>
                          <p className="font-medium">{formatDate(tracking.estimatedDelivery)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500 mb-1">סטטוס משלוח:</p>
                        <Badge 
                          className={`${shippingStatusMap[tracking.status || "default"].color} flex items-center justify-center h-7 px-3 inline-flex`}
                          variant="outline"
                        >
                          {shippingStatusMap[tracking.status || "default"].icon}
                          {shippingStatusMap[tracking.status || "default"].text}
                        </Badge>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="text-right">
                      <h3 className="text-lg font-semibold mb-4">היסטוריית משלוח</h3>
                      <ShippingHistory history={tracking.history} />
                    </div>
                  </CardContent>
                </Card>
                
                <div className="text-center">
                  <Button asChild variant="outline">
                    <Link href="/">חזרה לחנות</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default TrackOrderPage;