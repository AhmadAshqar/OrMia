import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsertInventory, Inventory, Product } from "@shared/schema";
import { PlusCircle, Edit, Loader2, Search, MoreHorizontal, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function InventoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [formState, setFormState] = useState<Partial<InsertInventory>>({
    productId: 0,
    quantity: 0,
    location: null,
    minimumStockLevel: 5,
    onOrder: 0,
    expectedDelivery: null,
  });
  
  // Fetch inventory
  const { data: inventory, isLoading: inventoryLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/admin/inventory"],
  });
  
  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Create inventory item mutation
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
        description: "פריט המלאי נוסף למערכת בהצלחה",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה ביצירת פריט מלאי",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update inventory item mutation
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
        description: "פריט המלאי עודכן במערכת בהצלחה",
      });
    },
    onError: (error: Error) => {
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
      location: null,
      minimumStockLevel: 5,
      onOrder: 0,
      expectedDelivery: null,
    });
    setEditingItem(null);
    setActiveTab("basic");
  };

  const handleOpenDialog = (item?: Inventory) => {
    if (item) {
      setEditingItem(item);
      setFormState({
        productId: item.productId,
        quantity: item.quantity,
        location: item.location,
        minimumStockLevel: item.minimumStockLevel || 5,
        onOrder: item.onOrder || 0,
        expectedDelivery: item.expectedDelivery,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    if (type === 'number') {
      const numberValue = value === '' ? 0 : Number(value);
      setFormState({
        ...formState,
        [name]: numberValue
      });
    } else if (name === 'expectedDelivery') {
      setFormState({
        ...formState,
        [name]: value ? new Date(value) : null
      });
    } else {
      setFormState({
        ...formState,
        [name]: value
      });
    }
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

    // Format data
    const inventoryData = {
      ...formState,
      quantity: formState.quantity || 0,
      minimumStockLevel: formState.minimumStockLevel || null,
      onOrder: formState.onOrder || null,
    } as InsertInventory;

    if (editingItem) {
      updateInventoryMutation.mutate({ id: editingItem.id, data: inventoryData });
    } else {
      createInventoryMutation.mutate(inventoryData);
    }
  };

  const isLoading = inventoryLoading || productsLoading;
  const isPending = createInventoryMutation.isPending || updateInventoryMutation.isPending;

  // Filter inventory based on search term
  const filteredInventory = inventory?.filter(item => {
    const product = products?.find(p => p.id === item.productId);
    const productName = product?.name?.toLowerCase() || '';
    const productSku = product?.sku?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return productName.includes(searchLower) || 
           productSku.includes(searchLower) || 
           item.location?.toLowerCase().includes(searchLower);
  });

  // Get product info by ID
  const getProductInfo = (productId: number) => {
    return products?.find(product => product.id === productId);
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('he-IL');
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול מלאי</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="ml-2 h-5 w-5" />
          הוסף פריט מלאי חדש
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
          <CardTitle className="text-xl">רשימת מלאי</CardTitle>
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
                    <TableHead>בהזמנה</TableHead>
                    <TableHead>תאריך הגעה צפוי</TableHead>
                    <TableHead>מיקום</TableHead>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory && filteredInventory.length > 0 ? (
                    filteredInventory.map((item) => {
                      const product = getProductInfo(item.productId);
                      const isLowStock = item.quantity <= (item.minimumStockLevel || 5);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{product?.name || `מוצר #${item.productId}`}</TableCell>
                          <TableCell>{product?.sku || '-'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.minimumStockLevel || 5}</TableCell>
                          <TableCell>{item.onOrder || 0}</TableCell>
                          <TableCell>{formatDate(item.expectedDelivery)}</TableCell>
                          <TableCell>{item.location || '-'}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              item.quantity === 0 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' 
                                : isLowStock
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            }`}>
                              {item.quantity === 0 
                                ? 'אזל מהמלאי' 
                                : isLowStock 
                                ? 'מלאי נמוך' 
                                : 'תקין'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(item)}>
                                  <Edit className="ml-2 h-4 w-4" />
                                  ערוך
                                </DropdownMenuItem>
                                {isLowStock && (
                                  <DropdownMenuItem className="text-amber-600">
                                    <ShieldAlert className="ml-2 h-4 w-4" />
                                    הזמנה מהירה
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                ? 'ערוך את נתוני פריט המלאי' 
                : 'הוסף פריט מלאי חדש למערכת'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <Tabs
              defaultValue="basic"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="basic">פרטים בסיסיים</TabsTrigger>
                <TabsTrigger value="additional">פרטים נוספים</TabsTrigger>
              </TabsList>
              
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="productId">מוצר</Label>
                    <select
                      id="productId"
                      name="productId"
                      value={formState.productId || ''}
                      onChange={handleInputChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                      required
                      disabled={!!editingItem}
                    >
                      <option value="">בחר מוצר</option>
                      {products?.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                  </div>
                  
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
                    <Label htmlFor="minimumStockLevel">רמת מלאי מינימלית</Label>
                    <Input
                      id="minimumStockLevel"
                      name="minimumStockLevel"
                      type="number"
                      min="0"
                      value={formState.minimumStockLevel === null ? '' : formState.minimumStockLevel}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-muted-foreground">כאשר הכמות תרד מתחת לערך זה, תתקבל התראה</p>
                  </div>
                </div>
              </TabsContent>
              
              {/* Additional Info Tab */}
              <TabsContent value="additional" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="location">מיקום במחסן</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formState.location || ''}
                      onChange={handleInputChange}
                      placeholder="לדוגמה: מדף A3"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="onOrder">כמות בהזמנה</Label>
                    <Input
                      id="onOrder"
                      name="onOrder"
                      type="number"
                      min="0"
                      value={formState.onOrder === null ? '' : formState.onOrder}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="expectedDelivery">תאריך הגעה צפוי</Label>
                    <Input
                      id="expectedDelivery"
                      name="expectedDelivery"
                      type="date"
                      value={formState.expectedDelivery ? new Date(formState.expectedDelivery).toISOString().split('T')[0] : ''}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
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