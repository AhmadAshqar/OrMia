import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Gem, Shield, ThumbsUp, Award, Star, Box } from "lucide-react";

const AboutPage = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = `${t("about")} | לוקס מויסנייט`;
    
    // Initialize scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("slide-in-visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    
    document.querySelectorAll(".slide-in").forEach((el) => {
      observer.observe(el);
    });
    
    return () => {
      observer.disconnect();
    };
  }, [t]);

  return (
    <>
      <Header />
      
      <div className="bg-gray-50 py-12 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-serif mb-6">
              <span className="block text-primary mb-2">לוקס מויסנייט</span>
              <span className="block">החזון שלנו</span>
            </h1>
            <p className="text-lg text-foreground/70 leading-relaxed">
              אנו מאמינים שכל אחד ראוי ליהנות מתכשיטים יוקרתיים בעלי מראה של יהלומים אמיתיים, 
              במחירים הוגנים ונגישים יותר. זו הסיבה שבחרנו להתמחות במויסנייט, 
              האלטרנטיבה היפה והאתית ביותר ליהלומים.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 mt-16 items-center">
            <div className="slide-in order-2 md:order-1">
              <h2 className="text-2xl md:text-3xl font-serif mb-4">הסיפור שלנו</h2>
              <p className="mb-4 leading-relaxed">
                לוקס מויסנייט נוסדה בשנת 2018 מתוך חזון להנגיש תכשיטים יוקרתיים לקהל הישראלי. 
                המייסדים שלנו, זוג צעיר שחיפש טבעת אירוסין, הופתעו מהמחירים הגבוהים של טבעות יהלום, 
                וגילו את המויסנייט כאלטרנטיבה מושלמת.
              </p>
              <p className="mb-4 leading-relaxed">
                לאחר מחקר מעמיק והתלהבות מאיכות והיופי של אבני המויסנייט, הם החליטו לחלוק את התגלית 
                הזו עם אחרים. היום, אנחנו גאים להציע מבחר רחב של תכשיטי מויסנייט באיכות גבוהה, 
                מתוך מחויבות לאיכות, יופי, ומחירים הוגנים.
              </p>
              <p className="leading-relaxed">
                אנו עובדים ישירות עם יצרנים מובילים בתחום המויסנייט כדי להבטיח את האיכות הגבוהה 
                ביותר לכל אבן ולכל תכשיט בקולקציה שלנו.
              </p>
            </div>
            <div className="slide-in order-1 md:order-2">
              <img 
                src="/ormia-logo.png" 
                alt="אור מיה תכשיטים - מויסנייט" 
                className="w-full rounded-md shadow-lg bg-black p-8"
              />
            </div>
          </div>
        </div>
      </div>
      
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif mb-3">מה זה מויסנייט?</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="max-w-2xl mx-auto text-lg text-foreground/80">
              גלו את האבן היפהפייה שכובשת את עולם התכשיטים
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="slide-in">
              <img 
                src="https://images.unsplash.com/photo-1584735010574-46eda95709dc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80" 
                alt="אבן מויסנייט" 
                className="w-full rounded-md shadow-lg"
              />
            </div>
            
            <div className="slide-in">
              <h3 className="text-2xl font-serif mb-4">ההיסטוריה של המויסנייט</h3>
              <p className="mb-4 leading-relaxed">
                מויסנייט הוא מינרל נדיר שהתגלה לראשונה בשנת 1893 על ידי המדען הצרפתי אנרי מואסן, 
                בתוך מכתש מטאוריט בקניון דיאבלו באריזונה. אבן זו כה נדירה בטבע עד שרוב המויסנייט 
                שבשימוש כיום מיוצר במעבדה.
              </p>
              <p className="mb-4 leading-relaxed">
                מבחינה כימית, מויסנייט הוא סיליקון קרביד (SiC). זוהי אבן קשה מאוד (9.25-9.5 בסולם מוס, כאשר 
                יהלום הוא 10), עם נצנוץ שעולה על של יהלום. למעשה, מויסנייט מפזר אור כמעט פי 2.5 יותר מיהלומים, 
                מה שמעניק לו את הברק המיוחד והזוהר.
              </p>
              <h3 className="text-2xl font-serif mb-4 mt-6">היתרונות של מויסנייט</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Gem className="text-primary mt-1 ml-2" />
                  <span>נצנוץ וברק עוצמתי יותר מיהלום</span>
                </li>
                <li className="flex items-start">
                  <Shield className="text-primary mt-1 ml-2" />
                  <span>עמידות גבוהה כמעט כמו יהלום (9.25 בסולם מוס)</span>
                </li>
                <li className="flex items-start">
                  <ThumbsUp className="text-primary mt-1 ml-2" />
                  <span>אלטרנטיבה אתית ואקולוגית ליהלומים טבעיים</span>
                </li>
                <li className="flex items-start">
                  <Award className="text-primary mt-1 ml-2" />
                  <span>מחיר נגיש בהרבה בהשוואה ליהלומים בגודל זהה</span>
                </li>
              </ul>
              
              <div className="mt-8">
                <Button asChild className="bg-primary hover:bg-primary/80 text-black">
                  <Link href="/products">
                    גלה את הקולקציה שלנו
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif mb-3">למה לבחור בנו</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="max-w-2xl mx-auto text-lg text-foreground/80">
              אנו מחויבים להעניק לכם את החוויה הטובה ביותר
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="slide-in bg-white p-8 rounded-lg shadow-sm">
              <Star className="h-12 w-12 text-primary mb-6" />
              <h3 className="text-xl font-serif mb-3">איכות ללא פשרות</h3>
              <p className="text-foreground/70 leading-relaxed">
                אנו בוחרים רק את אבני המויסנייט באיכות הגבוהה ביותר, עם דירוגי צבע וניקיון מעולים. 
                כל תכשיט שלנו עובר בקרת איכות קפדנית לפני שהוא נשלח ללקוח.
              </p>
            </div>
            
            <div className="slide-in bg-white p-8 rounded-lg shadow-sm">
              <Box className="h-12 w-12 text-primary mb-6" />
              <h3 className="text-xl font-serif mb-3">משלוח חינם והחזרות</h3>
              <p className="text-foreground/70 leading-relaxed">
                אנו מציעים משלוח חינם לכל רחבי ישראל בהזמנות מעל ₪1,000 ומדיניות החזרה נוחה של 30 יום. 
                אנו רוצים שתהיו בטוחים ומרוצים מהרכישה שלכם.
              </p>
            </div>
            
            <div className="slide-in bg-white p-8 rounded-lg shadow-sm">
              <Shield className="h-12 w-12 text-primary mb-6" />
              <h3 className="text-xl font-serif mb-3">אחריות לכל החיים</h3>
              <p className="text-foreground/70 leading-relaxed">
                כל תכשיט מגיע עם אחריות לכל החיים על האבן, ואחריות של שנה על עבודת הצורפות. 
                אנו עומדים מאחורי המוצרים שלנו לאורך זמן.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif mb-6">הצטרפו למשפחת אור מיה</h2>
            <p className="text-lg mb-8">
              הרשמו לניוזלטר שלנו לקבלת עדכונים על מבצעים, קולקציות חדשות ומידע שימושי על מויסנייט.
            </p>
            
            <form className="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
              <input 
                type="email" 
                placeholder={t("email_placeholder")} 
                className="flex-grow py-3 px-4 border border-gray-200 focus:border-primary focus:ring-primary outline-none transition-colors"
              />
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/80 text-black py-3 px-6 font-medium transition-colors whitespace-nowrap"
              >
                {t("subscribe")}
              </Button>
            </form>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default AboutPage;
