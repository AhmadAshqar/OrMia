import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Inventory, Product, InsertInventory } from "@shared/schema";
import { PlusCircle, AlertCircle, Edit, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function InventoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [formState, setFormState] = useState<Partial<InsertInventory>>({
    productId: 0,
    quantity: 0,
    minimumStockLevel: 5,
    onOrder: 0,
    location: "מחסן ראשי",
  });
  
  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });
  
  // Fetch inventory
  const { data: inventory, isLoading: inventoryLoading } = useQuery<(Inventory & { productName?: string; productSku?: string })[]>({
    queryKey: ["/api/admin/inventory"],
    onError: (error) => {
      toast({
        title: "שגיאה בטעינת נתוני מלאי",
        description: "לא ניתן היה לטעון את נתוני המלאי. נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  });

  // Create inventory mutation
  const createInventoryMutation = useMutation({
    mutationFn: async (data: InsertInventory) => {
      const res = await apiRequest("POST", "/api/admin/inventory", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "פריט מלאי נוצר בהצלחה",
        description: "הפריט נוסף למלאי בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה ביצירת פריט מלאי",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update inventory mutation
  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertInventory> }) => {
      const res = await apiRequest("PATCH", `/api/admin/inventory/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "פריט מלאי עודכן בהצלחה",
        description: "הפריט עודכן במערכת בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון פריט מלאי",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormState({
      productId: 0,
      quantity: 0,
      minimumStockLevel: 5,
      onOrder: 0,
      location: "מחסן ראשי",
    });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: Inventory) => {
    if (item) {
      setEditingItem(item);
      setFormState({
        productId: item.productId,
        quantity: item.quantity,
        minimumStockLevel: item.minimumStockLevel,
        onOrder: item.onOrder || 0,
        location: item.location,
        expectedDelivery: item.expectedDelivery ? new Date(item.expectedDelivery).toISOString().split('T')[0] : undefined,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    let parsedValue: any = value;
    
    if (type === 'number') {
      parsedValue = parseInt(value) || 0;
    }
    
    setFormState({
      ...formState,
      [name]: parsedValue
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.productId) {
      toast({
        title: "בחר מוצר",
        description: "יש לבחור מוצר עבור פריט המלאי",
        variant: "destructive",
      });
      return;
    }

    if (editingItem) {
      updateInventoryMutation.mutate({ id: editingItem.id, data: formState });
    } else {
      createInventoryMutation.mutate(formState as InsertInventory);
    }
  };

  const isLoading = productsLoading || inventoryLoading;
  const isPending = createInventoryMutation.isPending || updateInventoryMutation.isPending;

  // Filter inventory items based on search term
  const filteredInventory = inventory?.filter(item => {
    const productName = item.productName?.toLowerCase() || '';
    const productSku = item.productSku?.toLowerCase() || '';
    const location = item.location?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return productName.includes(searchLower) || 
           productSku.includes(searchLower) || 
           location.includes(searchLower);
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול מלאי</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="ml-2 h-5 w-5" />
          הוסף פריט מלאי
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center border rounded-lg px-3 py-2 max-w-md">
            <Search className="h-5 w-5 text-muted-foreground ml-2" />
            <Input 
              placeholder="חפש לפי שם מוצר, מק״ט או מיקום"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">מלאי מוצרים</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>שם מוצר</TableHead>
                    <TableHead>מק"ט</TableHead>
                    <TableHead>כמות במלאי</TableHead>
                    <TableHead>מלאי מינימלי</TableHead>
                    <TableHead>מיקום</TableHead>
                    <TableHead>כמות בהזמנה</TableHead>
                    <TableHead>תאריך אספקה צפוי</TableHead>
                    <TableHead>עדכון אחרון</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory && filteredInventory.length > 0 ? (
                    filteredInventory.map((item) => {
                      const product = products?.find(p => p.id === item.productId);
                      const isLowStock = item.quantity <= item.minimumStockLevel;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{product?.name || `מוצר #${item.productId}`}</TableCell>
                          <TableCell>{product?.sku || '-'}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <span>{item.quantity}</span>
                              {isLowStock && (
                                <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.minimumStockLevel}</TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell>{item.onOrder || 0}</TableCell>
                          <TableCell>
                            {item.expectedDelivery 
                              ? new Date(item.expectedDelivery).toLocaleDateString('he-IL') 
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(item.lastUpdated).toLocaleDateString('he-IL')}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleOpenDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                        {searchTerm ? 'לא נמצאו תוצאות לחיפוש' : 'לא נמצאו פריטי מלאי'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Inventory Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'עריכת פריט מלאי' : 'הוספת פריט מלאי חדש'}</DialogTitle>
            <DialogDescription>
              {editingItem 
                ? 'ערוך את נתוני המלאי לפריט זה' 
                : 'הוסף פריט מלאי חדש למערכת'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="productId">מוצר</Label>
                <select
                  id="productId"
                  name="productId"
                  value={formState.productId || ''}
                  onChange={handleInputChange}
                  disabled={!!editingItem}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="">בחר מוצר</option>
                  {products?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="quantity">כמות במלאי</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={formState.quantity || 0}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="minimumStockLevel">מלאי מינימלי</Label>
                  <Input
                    id="minimumStockLevel"
                    name="minimumStockLevel"
                    type="number"
                    min="1"
                    value={formState.minimumStockLevel || 5}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">מיקום</Label>
                <Input
                  id="location"
                  name="location"
                  value={formState.location || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="onOrder">כמות בהזמנה</Label>
                  <Input
                    id="onOrder"
                    name="onOrder"
                    type="number"
                    min="0"
                    value={formState.onOrder || 0}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="expectedDelivery">תאריך אספקה צפוי</Label>
                  <Input
                    id="expectedDelivery"
                    name="expectedDelivery"
                    type="date"
                    value={formState.expectedDelivery || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                ביטול
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    שומר...
                  </>
                ) : (
                  'שמור'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}