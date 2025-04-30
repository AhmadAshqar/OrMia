import { useState } from "react";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import TopBar from "@/components/layout/TopBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { 
  Form,
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

const contactFormSchema = z.object({
  name: z.string().min(2, {
    message: "שם חייב להכיל לפחות 2 תווים",
  }),
  email: z.string().email({
    message: "נא להזין כתובת דוא\"ל תקינה",
  }),
  phone: z.string().min(9, {
    message: "מספר טלפון חייב להכיל לפחות 9 ספרות",
  }),
  message: z.string().min(10, {
    message: "ההודעה חייבת להכיל לפחות 10 תווים",
  }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      message: "",
    },
  });
  
  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/contact", data);
      const result = await response.json();
      
      toast({
        title: "הודעה נשלחה בהצלחה",
        description: "נחזור אליך בהקדם האפשרי",
      });
      
      form.reset();
    } catch (error) {
      toast({
        title: "שגיאה בשליחת הטופס",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <TopBar />
      <Header />
      
      <div className="bg-gray-50 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-serif mb-2">{t("contact_us")}</h1>
          <p className="text-foreground/70">{t("contact_desc")}</p>
        </div>
      </div>
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1">
              <div className="bg-white p-8 shadow-sm h-full">
                <h2 className="text-2xl font-serif mb-6">פרטי התקשרות</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-primary mt-1 ml-3" />
                    <div>
                      <h3 className="font-medium mb-1">כתובת</h3>
                      <p className="text-foreground/70">רחוב אלנבי 40, תל אביב</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-primary mt-1 ml-3" />
                    <div>
                      <h3 className="font-medium mb-1">טלפון</h3>
                      <p className="text-foreground/70">03-1234567</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-primary mt-1 ml-3" />
                    <div>
                      <h3 className="font-medium mb-1">דוא"ל</h3>
                      <p className="text-foreground/70">info@luxmoissanite.co.il</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-primary mt-1 ml-3" />
                    <div>
                      <h3 className="font-medium mb-1">שעות פעילות</h3>
                      <p className="text-foreground/70">א'-ה': 9:00-19:00</p>
                      <p className="text-foreground/70">ו': 9:00-14:00</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="font-medium mb-3">עקבו אחרינו</h3>
                  <div className="flex gap-4">
                    <a 
                      href="#" 
                      className="bg-gray-100 hover:bg-primary hover:text-white text-foreground/70 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      aria-label="Facebook"
                    >
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a 
                      href="#" 
                      className="bg-gray-100 hover:bg-primary hover:text-white text-foreground/70 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      aria-label="Instagram"
                    >
                      <i className="fab fa-instagram"></i>
                    </a>
                    <a 
                      href="#" 
                      className="bg-gray-100 hover:bg-primary hover:text-white text-foreground/70 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                      aria-label="WhatsApp"
                    >
                      <i className="fab fa-whatsapp"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-white p-8 shadow-sm">
                <h2 className="text-2xl font-serif mb-6">שלח לנו הודעה</h2>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם מלא</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>דוא"ל</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>טלפון</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>הודעה</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              className="min-h-32" 
                              placeholder="כתוב את הודעתך כאן..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="bg-primary hover:bg-primary/80 text-black w-full md:w-auto"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -mr-1 ml-3 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          שולח...
                        </span>
                      ) : (
                        t("send_message")
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="bg-white p-4 shadow-sm">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3380.8083453701716!2d34.7718256!3d32.066314!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151d4b82a6148f7f%3A0x9f5e6e3b04a0307e!2z15DXnNeg15HXmSA0MCwg16rXnCDXkNeR15nXkS3Xmdek15U!5e0!3m2!1siw!2sil!4v1621845076284!5m2!1siw!2sil" 
              width="100%" 
              height="450" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy"
              title="מפת המיקום שלנו"
            ></iframe>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default ContactPage;
