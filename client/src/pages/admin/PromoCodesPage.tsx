import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import AdminLayout from "@/components/layout/AdminLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Define promo code type
type PromoCode = {
  id: number;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountAmount: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  createdByAdmin?: {
    id: number;
    username: string;
  };
};

// Create a schema for promo code form validation
const promoCodeSchema = z.object({
  code: z.string().min(3, { message: "קוד חייב להכיל לפחות 3 תווים" }).max(20, { message: "קוד יכול להכיל עד 20 תווים" }),
  description: z.string().min(3, { message: "יש להזין תיאור" }),
  discountType: z.enum(["percentage", "fixed"], { required_error: "יש לבחור סוג הנחה" }),
  discountAmount: z.coerce.number().min(1, { message: "ערך ההנחה חייב להיות חיובי" }),
  minOrderAmount: z.coerce.number().nullable().optional(),
  maxUses: z.coerce.number().nullable().optional(),
  isActive: z.boolean().default(true),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
});

type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;

const PromoCodesPage = () => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null);

  // Fetch promo codes
  const { data: promoCodes, isLoading } = useQuery<PromoCode[]>({
    queryKey: ["/api/admin/promo-codes"],
    queryFn: async () => {
      const response = await fetch("/api/admin/promo-codes");
      if (!response.ok) {
        throw new Error("Failed to fetch promo codes");
      }
      return response.json();
    }
  });

  // Create promo code mutation
  const createPromoCodeMutation = useMutation({
    mutationFn: async (data: PromoCodeFormValues) => {
      const response = await apiRequest("POST", "/api/admin/promo-codes", data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create promo code");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "קוד קופון נוצר בהצלחה",
        variant: "default",
      });
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה ביצירת קוד קופון",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update promo code mutation
  const updatePromoCodeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: PromoCodeFormValues }) => {
      const response = await apiRequest("PATCH", `/api/admin/promo-codes/${id}`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update promo code");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "קוד קופון עודכן בהצלחה",
        variant: "default",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון קוד קופון",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle promo code active status mutation
  const toggleActiveStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/promo-codes/${id}/toggle`, { isActive });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to toggle promo code status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({
        title: "סטטוס קוד קופון עודכן בהצלחה",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון סטטוס קוד קופון",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete promo code mutation
  const deletePromoCodeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/promo-codes/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete promo code");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({
        title: "קוד קופון נמחק בהצלחה",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה במחיקת קוד קופון",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Create form
  const form = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "percentage",
      discountAmount: 10,
      minOrderAmount: null,
      maxUses: null,
      isActive: true,
      startDate: null,
      endDate: null,
    },
  });

  // Edit form
  const editForm = useForm<PromoCodeFormValues>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
      description: "",
      discountType: "percentage",
      discountAmount: 10,
      minOrderAmount: null,
      maxUses: null,
      isActive: true,
      startDate: null,
      endDate: null,
    },
  });

  const handleCreateSubmit = (data: PromoCodeFormValues) => {
    createPromoCodeMutation.mutate(data);
  };

  const handleEditSubmit = (data: PromoCodeFormValues) => {
    if (!selectedPromoCode) return;
    updatePromoCodeMutation.mutate({ id: selectedPromoCode.id, data });
  };

  const handleEditClick = (promoCode: PromoCode) => {
    setSelectedPromoCode(promoCode);
    editForm.reset({
      code: promoCode.code,
      description: promoCode.description,
      discountType: promoCode.discountType,
      discountAmount: promoCode.discountAmount,
      minOrderAmount: promoCode.minOrderAmount,
      maxUses: promoCode.maxUses,
      isActive: promoCode.isActive,
      startDate: promoCode.startDate ? new Date(promoCode.startDate) : null,
      endDate: promoCode.endDate ? new Date(promoCode.endDate) : null,
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleActive = (promoCode: PromoCode) => {
    toggleActiveStatusMutation.mutate({
      id: promoCode.id,
      isActive: !promoCode.isActive,
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">ניהול קודי קופון</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>יצירת קוד קופון חדש</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>יצירת קוד קופון חדש</DialogTitle>
                <DialogDescription>
                  הזן את פרטי קוד הקופון החדש. לחץ על כפתור השמירה כאשר תסיים.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>קוד קופון</FormLabel>
                        <FormControl>
                          <Input placeholder="WELCOME10" {...field} />
                        </FormControl>
                        <FormDescription>
                          הקוד שלקוחות יזינו בעת הרכישה
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תיאור</FormLabel>
                        <FormControl>
                          <Input placeholder="קופון 10% הנחה ללקוחות חדשים" {...field} />
                        </FormControl>
                        <FormDescription>
                          תיאור פנימי של הקופון
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>סוג הנחה</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="בחר סוג הנחה" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">אחוז (%)</SelectItem>
                              <SelectItem value="fixed">סכום קבוע (₪)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="discountAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ערך ההנחה</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minOrderAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>סכום הזמנה מינימלי (₪)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value === null ? "" : field.value}
                              onChange={e => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            השאר ריק אם אין מינימום
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxUses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מקסימום שימושים</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              value={field.value === null ? "" : field.value}
                              onChange={e => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            השאר ריק ללא הגבלה
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>תאריך התחלה</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-right font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>בחר תאריך</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            השאר ריק לתחילה מיידית
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>תאריך סיום</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-right font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>בחר תאריך</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            השאר ריק לתוקף ללא הגבלה
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>פעיל</FormLabel>
                          <FormDescription>
                            האם הקופון זמין לשימוש
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createPromoCodeMutation.isPending}
                    >
                      {createPromoCodeMutation.isPending ? "מעבד..." : "שמור קוד קופון"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                <tr>
                  <th className="py-3 px-6 text-right">קוד</th>
                  <th className="py-3 px-6 text-right">תיאור</th>
                  <th className="py-3 px-6 text-right">הנחה</th>
                  <th className="py-3 px-6 text-right">תוקף</th>
                  <th className="py-3 px-6 text-right">שימושים</th>
                  <th className="py-3 px-6 text-right">סטטוס</th>
                  <th className="py-3 px-6 text-right">פעולות</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {promoCodes && promoCodes.length > 0 ? (
                  promoCodes.map((promoCode) => (
                    <tr key={promoCode.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-right">
                        <span className="font-medium">{promoCode.code}</span>
                      </td>
                      <td className="py-3 px-6 text-right">{promoCode.description}</td>
                      <td className="py-3 px-6 text-right">
                        {promoCode.discountType === "percentage" 
                          ? `${promoCode.discountAmount}%` 
                          : `₪${promoCode.discountAmount}`
                        }
                        {promoCode.minOrderAmount && (
                          <span className="text-xs block text-gray-500">
                            מינימום: ₪{promoCode.minOrderAmount}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        {promoCode.startDate || promoCode.endDate ? (
                          <div className="text-xs">
                            {promoCode.startDate && <div>מתחיל: {new Date(promoCode.startDate).toLocaleDateString("he-IL")}</div>}
                            {promoCode.endDate && <div>מסתיים: {new Date(promoCode.endDate).toLocaleDateString("he-IL")}</div>}
                          </div>
                        ) : (
                          <span className="text-xs">ללא הגבלה</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        {promoCode.maxUses ? (
                          <span>{promoCode.usedCount} / {promoCode.maxUses}</span>
                        ) : (
                          <span>{promoCode.usedCount} / ∞</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <Badge 
                          variant={promoCode.isActive ? "default" : "secondary"} 
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(promoCode)}
                        >
                          {promoCode.isActive ? "פעיל" : "לא פעיל"}
                        </Badge>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(promoCode)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  פעולה זו תמחק לצמיתות את קוד הקופון "{promoCode.code}".
                                  לא ניתן לשחזר קוד קופון לאחר מחיקתו.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deletePromoCodeMutation.mutate(promoCode.id)}
                                >
                                  מחק קוד קופון
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      לא נמצאו קודי קופון. לחץ על 'יצירת קוד קופון חדש' כדי להוסיף את הקוד הראשון.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>עריכת קוד קופון</DialogTitle>
              <DialogDescription>
                ערוך את פרטי קוד הקופון. לחץ על כפתור השמירה כאשר תסיים.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>קוד קופון</FormLabel>
                      <FormControl>
                        <Input placeholder="WELCOME10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>תיאור</FormLabel>
                      <FormControl>
                        <Input placeholder="קופון 10% הנחה ללקוחות חדשים" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סוג הנחה</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר סוג הנחה" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">אחוז (%)</SelectItem>
                            <SelectItem value="fixed">סכום קבוע (₪)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="discountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ערך ההנחה</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="minOrderAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סכום הזמנה מינימלי (₪)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value === null ? "" : field.value}
                            onChange={e => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          השאר ריק אם אין מינימום
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="maxUses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>מקסימום שימושים</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            value={field.value === null ? "" : field.value}
                            onChange={e => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          השאר ריק ללא הגבלה
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>תאריך התחלה</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-right font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>בחר תאריך</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          השאר ריק לתחילה מיידית
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>תאריך סיום</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-right font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>בחר תאריך</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          השאר ריק לתוקף ללא הגבלה
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>פעיל</FormLabel>
                        <FormDescription>
                          האם הקופון זמין לשימוש
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={updatePromoCodeMutation.isPending}
                  >
                    {updatePromoCodeMutation.isPending ? "מעבד..." : "שמור שינויים"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default PromoCodesPage;