import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, PencilIcon, Trash2Icon, PlusIcon, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define Zod schema for promo code
const promoCodeSchema = z.object({
  code: z.string().min(3, "קוד חייב להכיל לפחות 3 תווים").max(15, "קוד לא יכול להכיל יותר מ-15 תווים"),
  description: z.string().min(3, "תיאור חייב להכיל לפחות 3 תווים"),
  discountType: z.enum(["fixed", "percentage"], {
    required_error: "יש לבחור סוג הנחה",
  }),
  discountAmount: z.coerce
    .number()
    .positive("סכום ההנחה חייב להיות מספר חיובי")
    .min(1, "סכום ההנחה חייב להיות לפחות 1"),
  minOrderAmount: z.coerce
    .number()
    .nonnegative("סכום ההזמנה המינימלי חייב להיות מספר אי-שלילי")
    .optional()
    .nullable(),
  maxUses: z.coerce
    .number()
    .int("מספר השימושים המקסימלי חייב להיות מספר שלם")
    .nonnegative("מספר השימושים המקסימלי חייב להיות מספר אי-שלילי")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
});

type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;

interface PromoCode {
  id: number;
  code: string;
  description: string;
  discountType: "fixed" | "percentage";
  discountAmount: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: number;
  startDate: Date | null;
  endDate: Date | null;
}

export default function PromoCodesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: promoCodes, isLoading } = useQuery<PromoCode[]>({
    queryKey: ["/api/admin/promo-codes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/promo-codes");
      if (!res.ok) {
        throw new Error("שגיאה בטעינת קודי הקופון");
      }
      return res.json();
    },
  });

  const createPromoCode = useMutation({
    mutationFn: async (data: PromoCodeFormValues) => {
      const res = await apiRequest("POST", "/api/admin/promo-codes", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "שגיאה ביצירת קוד קופון");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "קוד קופון נוצר בהצלחה",
        description: "קוד הקופון נוצר ונוסף למערכת בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה ביצירת קוד קופון",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePromoCode = useMutation({
    mutationFn: async (data: { id: number; promoCode: PromoCodeFormValues }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/admin/promo-codes/${data.id}`,
        data.promoCode
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "שגיאה בעדכון קוד קופון");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "קוד קופון עודכן בהצלחה",
        description: "קוד הקופון עודכן במערכת בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      setIsOpen(false);
      setEditingPromoCode(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בעדכון קוד קופון",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePromoStatus = useMutation({
    mutationFn: async (data: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/promo-codes/${data.id}/toggle`, {
        isActive: data.isActive,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "שגיאה בשינוי סטטוס קוד הקופון");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "סטטוס קוד קופון עודכן",
        description: `קוד הקופון ${variables.isActive ? "הופעל" : "הושבת"} בהצלחה`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה בשינוי סטטוס קוד קופון",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePromoCode = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/promo-codes/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "שגיאה במחיקת קוד קופון");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "קוד קופון נמחק בהצלחה",
        description: "קוד הקופון נמחק מהמערכת בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה במחיקת קוד קופון",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PromoCodeFormValues) => {
    if (editingPromoCode) {
      updatePromoCode.mutate({ id: editingPromoCode.id, promoCode: data });
    } else {
      createPromoCode.mutate(data);
    }
  };

  const handleEditPromoCode = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode);
    form.reset({
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
    setIsOpen(true);
  };

  const handleNewPromoCode = () => {
    setEditingPromoCode(null);
    form.reset({
      code: "",
      description: "",
      discountType: "percentage",
      discountAmount: 10,
      minOrderAmount: null,
      maxUses: null,
      isActive: true,
      startDate: null,
      endDate: null,
    });
    setIsOpen(true);
  };

  const formatDate = (date: Date | null | string): string => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: he });
  };

  return (
    <AdminLayout title="ניהול קודי קופון">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={handleNewPromoCode} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          קוד קופון חדש
        </Button>
      </div>

      <div className="bg-white p-6 rounded-md shadow">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <Table>
            <TableCaption>רשימת קודי קופון פעילים במערכת</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">קוד</TableHead>
                <TableHead className="text-right">תיאור</TableHead>
                <TableHead className="text-right">סוג הנחה</TableHead>
                <TableHead className="text-right">ערך הנחה</TableHead>
                <TableHead className="text-right">הזמנה מינ׳</TableHead>
                <TableHead className="text-right">מקס׳ שימושים</TableHead>
                <TableHead className="text-right">שימושים</TableHead>
                <TableHead className="text-right">תאריך התחלה</TableHead>
                <TableHead className="text-right">תאריך סיום</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-4">
                    אין קודי קופון במערכת. צור קוד קופון חדש כדי להתחיל.
                  </TableCell>
                </TableRow>
              ) : (
                promoCodes?.map((promoCode) => (
                  <TableRow key={promoCode.id}>
                    <TableCell className="font-medium">{promoCode.code}</TableCell>
                    <TableCell>{promoCode.description}</TableCell>
                    <TableCell>
                      {promoCode.discountType === "percentage" ? "אחוזים" : "סכום קבוע"}
                    </TableCell>
                    <TableCell>
                      {promoCode.discountType === "percentage"
                        ? `${promoCode.discountAmount}%`
                        : `₪${promoCode.discountAmount}`}
                    </TableCell>
                    <TableCell>
                      {promoCode.minOrderAmount ? `₪${promoCode.minOrderAmount}` : "-"}
                    </TableCell>
                    <TableCell>{promoCode.maxUses || "ללא הגבלה"}</TableCell>
                    <TableCell>{promoCode.usedCount}</TableCell>
                    <TableCell>{formatDate(promoCode.startDate)}</TableCell>
                    <TableCell>{formatDate(promoCode.endDate)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={promoCode.isActive}
                          onCheckedChange={(isActive) =>
                            togglePromoStatus.mutate({ id: promoCode.id, isActive })
                          }
                        />
                        <span className="mr-2">
                          {promoCode.isActive ? "פעיל" : "לא פעיל"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditPromoCode(promoCode)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            if (
                              window.confirm(
                                `האם אתה בטוח שברצונך למחוק את קוד הקופון "${promoCode.code}"?`
                              )
                            ) {
                              deletePromoCode.mutate(promoCode.id);
                            }
                          }}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPromoCode ? "עריכת קוד קופון" : "הוספת קוד קופון חדש"}
            </DialogTitle>
            <DialogDescription>
              {editingPromoCode
                ? "עדכן את פרטי קוד הקופון הקיים"
                : "הזן את פרטי קוד הקופון החדש"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>קוד קופון</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="לדוגמה: WELCOME10" />
                      </FormControl>
                      <FormDescription>
                        קוד הקופון שהלקוחות יזינו בעגלת הקניות
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
                        <Input {...field} placeholder="לדוגמה: 10% הנחה לחברים חדשים" />
                      </FormControl>
                      <FormDescription>תיאור קצר להסבר מטרת הקופון</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר סוג הנחה" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">אחוזים (%)</SelectItem>
                          <SelectItem value="fixed">סכום קבוע (₪)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>הנחה באחוזים או בסכום קבוע</FormDescription>
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
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          placeholder={
                            form.watch("discountType") === "percentage" ? "10" : "50"
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {form.watch("discountType") === "percentage"
                          ? "אחוז ההנחה (לדוגמה: 10 עבור 10%)"
                          : "סכום ההנחה בשקלים (לדוגמה: 50 עבור ₪50 הנחה)"}
                      </FormDescription>
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
                      <FormLabel>סכום הזמנה מינימלי</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="0"
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        סכום ההזמנה המינימלי הנדרש לשימוש בקוד (השאר ריק לאפשר שימוש
                        ללא מינימום)
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
                      <FormLabel>מספר שימושים מקסימלי</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          placeholder="ללא הגבלה"
                          value={field.value === null ? "" : field.value}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        כמה פעמים ניתן להשתמש בקוד (השאר ריק לשימוש ללא הגבלה)
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
                              variant="outline"
                              className={`w-full pl-3 text-right font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: he })
                              ) : (
                                <span>בחר תאריך...</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(date) => field.onChange(date)}
                            locale={he}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        התאריך שבו הקוד יתחיל להיות פעיל (אופציונלי)
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
                              variant="outline"
                              className={`w-full pl-3 text-right font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: he })
                              ) : (
                                <span>בחר תאריך...</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(date) => field.onChange(date)}
                            locale={he}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        התאריך שבו הקוד יפסיק להיות פעיל (אופציונלי)
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">קוד פעיל</FormLabel>
                      <FormDescription>
                        האם קוד הקופון יהיה זמין לשימוש מיד לאחר יצירתו
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
                <Button type="submit" disabled={createPromoCode.isPending || updatePromoCode.isPending}>
                  {(createPromoCode.isPending || updatePromoCode.isPending) && (
                    <div className="animate-spin w-4 h-4 border-2 border-background border-t-transparent rounded-full mr-2"></div>
                  )}
                  {editingPromoCode ? "עדכן קוד קופון" : "צור קוד קופון"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}