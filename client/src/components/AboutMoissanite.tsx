import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check } from "lucide-react";

export default function AboutMoissanite() {
  const features = [
    "נצנוץ מרהיב וזוהר",
    "עמידות גבוהה מאוד",
    "אלטרנטיבה אתית ליהלומים",
    "ערך מעולה למחיר",
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="slide-in">
            <img 
              src="https://images.unsplash.com/photo-1584735010574-46eda95709dc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80" 
              alt="מויסנייט" 
              className="w-full rounded-sm shadow-lg"
            />
          </div>
          
          <div className="slide-in">
            <h2 className="text-3xl md:text-4xl font-serif mb-4">יופי שמעבר ליהלום</h2>
            <div className="w-16 h-1 bg-[hsl(var(--gold))] mb-6"></div>
            <p className="text-[hsl(var(--black-light))] mb-4 leading-relaxed">
              מויסנייט הוא אבן חן מרהיבה שנתגלתה לראשונה בשנת 1893 על ידי המדען הצרפתי הנרי מויסן. בעלת נצנוץ ובהירות יוצאי דופן, המויסנייט משלבת יופי ועמידות, ולעתים קרובות נחשבת לאלטרנטיבה אתית ויפהפייה ליהלומים.
            </p>
            <p className="text-[hsl(var(--black-light))] mb-6 leading-relaxed">
              אצלנו בלוקס מויסנייט, אנו בוחרים רק את אבני המויסנייט באיכות הגבוהה ביותר, המשלבות נצנוץ יוצא דופן עם דירוג צבע וניקיון מעולים. כל תכשיט מעוצב ומיוצר בקפידה כדי להבטיח איכות ועמידות לאורך זמן.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <Check className="text-[hsl(var(--gold))] mt-1 ml-2" />
                  <p>{feature}</p>
                </div>
              ))}
            </div>
            
            <Button
              asChild
              className="bg-black hover:bg-[hsl(var(--gold))] text-white px-8 py-3 font-medium transition-colors duration-300"
            >
              <Link href="/about">
                גלה עוד
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
