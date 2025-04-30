import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "שגיאה",
        description: "אנא הזן כתובת אימייל תקינה",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await apiRequest('POST', '/api/newsletter', { email });
      toast({
        title: "תודה שנרשמת!",
        description: "אנו נשלח לך עדכונים על מבצעים חדשים.",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה ברישום לעדכונים. אנא נסה שוב מאוחר יותר.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 bg-black text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-serif mb-4">הצטרפו לרשימת התפוצה שלנו</h2>
          <p className="mb-8 text-white/80">
            הירשמו לקבלת עדכונים על מבצעים, קולקציות חדשות ומידע בלעדי.
          </p>
          
          <form 
            className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto"
            onSubmit={handleSubmit}
          >
            <Input 
              type="email" 
              placeholder="כתובת האימייל שלך" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow py-3 px-4 bg-white/10 border border-white/20 focus:border-[hsl(var(--gold))] outline-none transition-colors text-white"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-dark))] text-black py-3 px-6 font-medium transition-colors whitespace-nowrap"
            >
              {isSubmitting ? "שולח..." : "הרשמה"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
