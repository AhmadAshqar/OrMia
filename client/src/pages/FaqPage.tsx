import { useState } from "react";
import { useTranslation } from "react-i18next";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

const FaqPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // FAQ categories and questions
  const faqCategories = [
    {
      id: "about-moissanite",
      title: "אודות מויסנייט",
      questions: [
        {
          id: "what-is-moissanite",
          question: "מה זה מויסנייט?",
          answer: "מויסנייט הוא מינרל נדיר שהתגלה לראשונה ב-1893 על ידי הכימאי הצרפתי אנרי מואסן בתוך מכתש מטאוריט. כיום, מויסנייט מיוצר במעבדה ומשמש כאלטרנטיבה פופולרית ליהלומים בתכשיטים. מויסנייט ידוע בברק ונצנוץ שלו, שעולה על זה של יהלום."
        },
        {
          id: "moissanite-vs-diamond",
          question: "מה ההבדל בין מויסנייט ליהלום?",
          answer: "בעוד שיהלומים ומויסנייט דומים במראה, ישנם מספר הבדלים עיקריים: מויסנייט הוא יותר נוצץ ומחזיר יותר אור מיהלום, מויסנייט קשה כמעט כמו יהלום (9.25 בסולם מוס לעומת 10), ומויסנייט עולה פחות באופן משמעותי מיהלום באותו גודל וחיתוך."
        },
        {
          id: "moissanite-quality",
          question: "איך אני יכול לדעת שאני קונה מויסנייט איכותי?",
          answer: "מויסנייט איכותי צריך להיות שקוף, נקי מפגמים נראים לעין, ובעל ניקיון גבוה. אצלנו, כל אבני המויסנייט שאנו משתמשים בהן הן באיכות הגבוהה ביותר, עם דירוג צבע וניקיון מעולים. כל תכשיט מגיע עם תעודת אחריות המעידה על האיכות והמקור של האבן."
        },
        {
          id: "moissanite-durability",
          question: "האם מויסנייט עמיד לאורך זמן?",
          answer: "כן, מויסנייט הוא אחד המינרלים הקשים ביותר, עם דירוג של 9.25 בסולם מוס (יהלום הוא 10). זה הופך אותו לעמיד מאוד לשריטות, שחיקה ופגיעות, מה שמאפשר לו להישאר יפה במשך שנים רבות של שימוש יומיומי."
        }
      ]
    },
    {
      id: "shipping-returns",
      title: "משלוחים והחזרות",
      questions: [
        {
          id: "shipping-time",
          question: "כמה זמן לוקח למשלוח להגיע?",
          answer: "זמני המשלוח שלנו הם כדלקמן: משלוח רגיל: 3-5 ימי עסקים בכל רחבי ישראל. משלוח מהיר: 1-2 ימי עסקים. אנו מספקים מספר מעקב לכל המשלוחים כדי שתוכלו לעקוב אחר ההזמנה שלכם."
        },
        {
          id: "shipping-costs",
          question: "כמה עולה המשלוח?",
          answer: "עלות המשלוח הרגיל היא ₪35. משלוח מהיר עולה ₪60. כל ההזמנות מעל ₪1,000 זכאיות למשלוח חינם!"
        },
        {
          id: "return-policy",
          question: "מה מדיניות ההחזרה שלכם?",
          answer: "אנו מציעים מדיניות החזרה של 30 יום על כל המוצרים שלנו. אם אינך מרוצה מהרכישה שלך מכל סיבה שהיא, אתה יכול להחזיר אותה תוך 30 יום מיום קבלתה לקבלת החזר מלא או להחליף אותה במוצר אחר. המוצר חייב להיות במצב מקורי, ללא נזק ועם תיעוד הקנייה המקורי."
        },
        {
          id: "international-shipping",
          question: "האם אתם שולחים גם לחו\"ל?",
          answer: "כרגע אנחנו מתמקדים בשוק הישראלי ומספקים משלוחים רק בתוך ישראל. אנו מקווים להרחיב את השירותים שלנו בעתיד."
        }
      ]
    },
    {
      id: "payment-security",
      title: "תשלום ואבטחה",
      questions: [
        {
          id: "payment-methods",
          question: "אילו אמצעי תשלום אתם מקבלים?",
          answer: "אנו מקבלים את כל כרטיסי האשראי העיקריים (ויזה, מאסטרקארד, אמריקן אקספרס, ישראכרט), PayPal, Bit, וכן אפשרות לתשלום בהעברה בנקאית."
        },
        {
          id: "payment-security",
          question: "האם התשלום באתר מאובטח?",
          answer: "בהחלט! האתר שלנו משתמש בהצפנת SSL מתקדמת להגנה על המידע האישי והפיננסי שלך. כל פרטי התשלום מוצפנים ומאובטחים בהתאם לתקני האבטחה המחמירים ביותר."
        },
        {
          id: "installment-payments",
          question: "האם יש אפשרות לתשלומים?",
          answer: "כן, אנו מציעים אפשרות לחלק את התשלום עד 12 תשלומים ללא ריבית בכרטיס אשראי, בהתאם לתנאים של חברת האשראי שלך."
        }
      ]
    },
    {
      id: "product-care",
      title: "טיפול במוצרים",
      questions: [
        {
          id: "moissanite-care",
          question: "איך לטפל בתכשיטי מויסנייט?",
          answer: "למרות שמויסנייט עמיד מאוד, מומלץ לטפל בתכשיטים בזהירות: הסר תכשיטים בזמן פעילות גופנית או עבודות בית. נקה באופן קבוע עם מים פושרים וסבון עדין. אחסן תכשיטים בנפרד כדי למנוע שריטות. הימנע ממגע עם כימיקלים קשים כמו כלור ואצטון."
        },
        {
          id: "cleaning-tips",
          question: "איך לנקות את תכשיטי המויסנייט שלי?",
          answer: "לניקוי שגרתי, השרה את התכשיט במים פושרים עם מעט סבון כלים עדין למשך 20-30 דקות. לאחר מכן, הברש בעדינות עם מברשת שיניים רכה, שטוף היטב במים נקיים, ויבש עם מטלית רכה. לניקוי מקצועי, מומלץ להביא את התכשיט לחנות שלנו אחת לשנה."
        },
        {
          id: "resize-repair",
          question: "האם אתם מציעים שירותי תיקון ושינוי מידה?",
          answer: "כן, אנו מציעים שירותי תיקון ושינוי מידה לכל התכשיטים שלנו. עלות השירות תלויה בסוג התיקון או השינוי הנדרש. אנא צרו קשר עם שירות הלקוחות שלנו לקבלת מידע נוסף."
        }
      ]
    },
    {
      id: "warranty",
      title: "אחריות",
      questions: [
        {
          id: "warranty-coverage",
          question: "מה כוללת האחריות שלכם?",
          answer: "כל תכשיט שלנו מגיע עם אחריות לכל החיים על אבן המויסנייט ואחריות של שנה על עבודת הצורפות. האחריות מכסה פגמים בחומר ובעבודה, אך אינה מכסה נזק שנגרם משימוש לא נכון, תאונות, או בלאי רגיל."
        },
        {
          id: "warranty-claim",
          question: "איך אני מגיש תביעת אחריות?",
          answer: "כדי להגיש תביעת אחריות, פשוט צרו קשר עם שירות הלקוחות שלנו דרך הטלפון, האימייל או טופס יצירת הקשר באתר. תצטרכו לספק את פרטי הרכישה ותיאור של הבעיה. לאחר שנאשר את תביעת האחריות, נשלח לכם הוראות להחזרת התכשיט לתיקון או החלפה."
        }
      ]
    }
  ];
  
  // Filter FAQs based on search query
  const filteredFaqs = searchQuery.trim() !== ""
    ? faqCategories.map(category => ({
        ...category,
        questions: category.questions.filter(q => 
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0)
    : faqCategories;

  return (
    <>
      <Header />
      
      <div className="bg-gray-50 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-serif mb-2">{t("faqs")}</h1>
          <p className="text-foreground/70">{t("faq_desc")}</p>
        </div>
      </div>
      
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto mb-12">
            <div className="relative">
              <Input
                type="search"
                placeholder="חפש שאלות ותשובות..."
                className="pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-4">לא נמצאו תוצאות</h2>
              <p className="text-foreground/70 mb-6">נסה לחפש מונחים אחרים או לנקות את החיפוש</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
              >
                נקה חיפוש
              </Button>
            </div>
          ) : (
            filteredFaqs.map((category) => (
              <div key={category.id} className="mb-10">
                <h2 className="text-2xl font-serif mb-6">{category.title}</h2>
                <Accordion type="single" collapsible className="bg-white rounded-md shadow-sm">
                  {category.questions.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="px-6 hover:no-underline hover:bg-gray-50">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <p className="text-foreground/80 leading-relaxed">
                          {item.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
          
          <div className="mt-12 py-8 border-t border-gray-200">
            <div className="text-center">
              <h2 className="text-2xl font-serif mb-4">יש לך שאלה שלא מופיעה כאן?</h2>
              <p className="text-foreground/70 mb-6">אנחנו תמיד כאן לעזור. צור קשר עם צוות שירות הלקוחות שלנו.</p>
              <Button asChild className="bg-primary hover:bg-primary/80 text-black">
                <Link href="/contact">
                  צור קשר
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default FaqPage;
