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
  DialogClose,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Product, Category, InsertProduct } from "@shared/schema";
import { PlusCircle, Edit, Trash2, MoreHorizontal, Loader2, Search, ImagePlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";

export default function ProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [formState, setFormState] = useState<Partial<InsertProduct>>({
    name: "",
    description: "",
    longDescription: "",
    price: 0,
    salePrice: null,
    mainImage: "",
    images: "[]",
    categoryId: 0,
    sku: "",
    inStock: true,
    isNew: false,
    isFeatured: false,
    rating: 5,
    reviewCount: 0,
  });
  
  // Fetch products - use regular product endpoint to match public site
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    staleTime: 0, // Always refetch when component mounts
    refetchOnMount: true
  });
  
  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "מוצר נוצר בהצלחה",
        description: "המוצר נוסף למערכת בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה ביצירת מוצר",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProduct> }) => {
      const res = await apiRequest("PATCH", `/api/products/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "מוצר עודכן בהצלחה",
        description: "המוצר עודכן במערכת בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון מוצר",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/products/${id}`);
      // DELETE requests with 204 status don't return any content
      // Just return a success message for our frontend
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/featured"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/inventory"] });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      toast({
        title: "מוצר נמחק בהצלחה",
        description: "המוצר הוסר מהמערכת בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה במחיקת מוצר",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormState({
      name: "",
      description: "",
      longDescription: "",
      price: 0,
      salePrice: null,
      mainImage: "",
      images: "[]",
      categoryId: 0,
      sku: "",
      inStock: true,
      isNew: false,
      isFeatured: false,
      rating: 5,
      reviewCount: 0,
    });
    setEditingProduct(null);
    setActiveTab("basic");
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormState({
        name: product.name,
        description: product.description,
        longDescription: product.longDescription || "",
        price: product.price,
        salePrice: product.salePrice,
        mainImage: product.mainImage,
        images: product.images || "[]",
        categoryId: product.categoryId,
        sku: product.sku,
        inStock: product.inStock,
        isNew: product.isNew,
        isFeatured: product.isFeatured,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteProduct = () => {
    if (!productToDelete) return;
    deleteProductMutation.mutate(productToDelete.id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle different input types
    if (type === 'number') {
      const numberValue = value === '' ? null : Number(value);
      setFormState({
        ...formState,
        [name]: numberValue
      });
    } else {
      setFormState({
        ...formState,
        [name]: value
      });
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormState({
      ...formState,
      [name]: checked
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormState({
      ...formState,
      [name]: parseInt(value)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.categoryId || formState.categoryId === 0) {
      toast({
        title: "בחר קטגוריה",
        description: "יש לבחור קטגוריה עבור המוצר",
        variant: "destructive",
      });
      setActiveTab("basic");
      return;
    }

    if (!formState.sku) {
      toast({
        title: "הזן מק\"ט",
        description: "יש להזין מק\"ט ייחודי עבור המוצר",
        variant: "destructive",
      });
      return;
    }
    
    if (!formState.mainImage) {
      toast({
        title: "הוסף תמונה",
        description: "יש להוסיף תמונה עבור המוצר",
        variant: "destructive",
      });
      return;
    }
    
    if (!formState.name || !formState.description) {
      toast({
        title: "מידע חסר",
        description: "יש להזין שם ותיאור עבור המוצר",
        variant: "destructive",
      });
      return;
    }

    // Convert values to proper types
    const productData = {
      name: formState.name || "",
      description: formState.description || "",
      price: Number(formState.price || 0),
      mainImage: formState.mainImage || "",
      sku: formState.sku || "",
      categoryId: Number(formState.categoryId || 0),
      // Optional fields with defaults
      salePrice: formState.salePrice ? Number(formState.salePrice) : null,
      longDescription: formState.longDescription || "",
      images: formState.images || "[]",
      rating: Number(formState.rating || 5),
      reviewCount: Number(formState.reviewCount || 0),
      inStock: Boolean(formState.inStock),
      isNew: Boolean(formState.isNew),
      isFeatured: Boolean(formState.isFeatured)
    } as InsertProduct;

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const isLoading = productsLoading || categoriesLoading;
  const isPending = createProductMutation.isPending || updateProductMutation.isPending;

  // Filter products based on search term
  const filteredProducts = products?.filter(product => {
    const productName = product.name.toLowerCase();
    const productDesc = product.description.toLowerCase();
    const productSku = product.sku.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return productName.includes(searchLower) || 
           productDesc.includes(searchLower) || 
           productSku.includes(searchLower);
  });

  // Format price in ILS
  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(price / 100);
  };

  // Get category name by ID
  const getCategoryName = (categoryId: number) => {
    const category = categories?.find(cat => cat.id === categoryId);
    return category?.name || '-';
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">ניהול מוצרים</h1>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="ml-2 h-5 w-5" />
          הוסף מוצר חדש
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center border rounded-lg px-3 py-2 max-w-md">
            <Search className="h-5 w-5 text-muted-foreground ml-2" />
            <Input 
              placeholder="חפש לפי שם, תיאור או מק״ט"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">רשימת מוצרים</CardTitle>
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
                    <TableHead>מחיר</TableHead>
                    <TableHead>מחיר מבצע</TableHead>
                    <TableHead>קטגוריה</TableHead>
                    <TableHead>מצב מלאי</TableHead>
                    <TableHead>מוצג בדף הראשי</TableHead>
                    <TableHead>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts && filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
                        <TableCell>{formatPrice(product.salePrice)}</TableCell>
                        <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.inStock 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          }`}>
                            {product.inStock ? 'במלאי' : 'אזל מהמלאי'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.isFeatured 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                          }`}>
                            {product.isFeatured ? 'כן' : 'לא'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                                <Edit className="ml-2 h-4 w-4" />
                                ערוך
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleOpenDeleteDialog(product)}
                                className="text-red-600"
                              >
                                <Trash2 className="ml-2 h-4 w-4" />
                                מחק
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                        {searchTerm ? 'לא נמצאו תוצאות לחיפוש' : 'לא נמצאו מוצרים'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'ערוך את נתוני המוצר' 
                : 'הוסף מוצר חדש למערכת'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <Tabs
              defaultValue="basic"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-6">
                <TabsTrigger value="basic">מידע בסיסי</TabsTrigger>
                <TabsTrigger value="pricing">תמחור</TabsTrigger>
                <TabsTrigger value="media">תמונות</TabsTrigger>
                <TabsTrigger value="settings">הגדרות</TabsTrigger>
              </TabsList>
              
              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">שם המוצר</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formState.name || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">תיאור קצר</Label>
                    <Textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={formState.description || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="longDescription">תיאור מפורט</Label>
                    <Textarea
                      id="longDescription"
                      name="longDescription"
                      rows={5}
                      value={formState.longDescription || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sku">מק"ט מוצר</Label>
                      <Input
                        id="sku"
                        name="sku"
                        value={formState.sku || ''}
                        onChange={handleInputChange}
                        disabled={!!editingProduct}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="categoryId">קטגוריה</Label>
                      <Select
                        value={formState.categoryId?.toString() || 'placeholder'}
                        onValueChange={(value) => {
                          if (value === 'placeholder') {
                            setFormState({
                              ...formState,
                              categoryId: undefined
                            });
                          } else {
                            setFormState({
                              ...formState,
                              categoryId: parseInt(value)
                            });
                          }
                        }}
                        required
                      >
                        <SelectTrigger id="categoryId">
                          <SelectValue placeholder="בחר קטגוריה" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placeholder">בחר קטגוריה</SelectItem>
                          {categories?.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Pricing Tab */}
              <TabsContent value="pricing" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">מחיר (בש"ח)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formState.price || ''}
                        onChange={handleInputChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">המחיר יישמר באגורות</p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="salePrice">מחיר מבצע (בש"ח)</Label>
                      <Input
                        id="salePrice"
                        name="salePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formState.salePrice || ''}
                        onChange={handleInputChange}
                      />
                      <p className="text-xs text-muted-foreground">השאר ריק אם אין מחיר מבצע</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Media Tab */}
              <TabsContent value="media" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="mainImage">תמונה ראשית (URL)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="mainImage"
                        name="mainImage"
                        value={formState.mainImage || ''}
                        onChange={handleInputChange}
                        required
                        className="flex-1"
                      />
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline">
                            <ImagePlus className="h-4 w-4 ml-2" />
                            בחר תמונה
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>בחירת תמונה</DialogTitle>
                            <DialogDescription>
                              בחר תמונה מהגלריה או הזן URL של תמונה
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label>הזן URL של תמונה</Label>
                              <div className="flex gap-2">
                                <Input 
                                  value={formState.mainImage || ''}
                                  onChange={(e) => {
                                    setFormState({
                                      ...formState,
                                      mainImage: e.target.value
                                    });
                                  }}
                                  placeholder="https://example.com/image.jpg"
                                  className="flex-1"
                                />
                                <DialogClose asChild>
                                  <Button type="button">
                                    אישור
                                  </Button>
                                </DialogClose>
                              </div>
                            </div>
                            
                            <div className="border-t pt-4">
                              <Label className="mb-4 block">תמונות לדוגמה</Label>
                              <div className="grid grid-cols-3 gap-4">
                                {[
                                  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                                  "https://images.unsplash.com/photo-1602752250015-52285b9d25c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                                  "https://images.unsplash.com/photo-1611085583191-a3b181a88401?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                                  "https://images.unsplash.com/photo-1588444650733-d2874faa2b3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                                  "https://images.unsplash.com/photo-1602425721711-5e891095d0e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                                  "https://images.unsplash.com/photo-1518726289780-1596cdcc3d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60",
                                ].map((src, i) => (
                                  <DialogClose key={i} asChild>
                                    <div 
                                      className="border rounded-md p-2 cursor-pointer hover:border-primary transition-colors"
                                      onClick={() => {
                                        setFormState({
                                          ...formState,
                                          mainImage: src
                                        });
                                      }}
                                    >
                                      <img 
                                        src={src} 
                                        alt={`תמונה לדוגמה ${i+1}`} 
                                        className="w-full h-32 object-contain"
                                      />
                                    </div>
                                  </DialogClose>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  {formState.mainImage && (
                    <div className="grid gap-2">
                      <Label>תצוגה מקדימה</Label>
                      <div className="border rounded-md p-2 w-full max-w-[200px]">
                        <img 
                          src={formState.mainImage} 
                          alt="תצוגה מקדימה" 
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inStock" className="cursor-pointer">זמין במלאי</Label>
                    <Switch
                      id="inStock"
                      checked={formState.inStock || false}
                      onCheckedChange={(checked) => handleCheckboxChange("inStock", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isNew" className="cursor-pointer">מוצר חדש</Label>
                    <Switch
                      id="isNew"
                      checked={formState.isNew || false}
                      onCheckedChange={(checked) => handleCheckboxChange("isNew", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isFeatured" className="cursor-pointer">הצג בדף הראשי</Label>
                    <Switch
                      id="isFeatured"
                      checked={formState.isFeatured || false}
                      onCheckedChange={(checked) => handleCheckboxChange("isFeatured", checked)}
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
      
      {/* Delete Product Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את המוצר "{productToDelete?.name}" מהמערכת לצמיתות.
              {productToDelete?.isFeatured && (
                <p className="text-amber-600 mt-2">
                  שים לב: מוצר זה מופיע בדף הראשי.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteProduct}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מוחק...
                </>
              ) : (
                'מחק מוצר'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}