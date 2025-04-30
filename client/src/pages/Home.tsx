import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import ProductCategories from "@/components/ProductCategories";
import AboutMoissanite from "@/components/AboutMoissanite";
import Testimonials from "@/components/Testimonials";
import InstagramFeed from "@/components/InstagramFeed";
import Newsletter from "@/components/Newsletter";
import { Gem, Truck, IdCard } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <Gem className="h-10 w-10" />,
      title: "איכות ללא פשרות",
      description: "כל תכשיט עובר תהליך ביקורת איכות קפדני לפני שהוא נשלח ללקוח."
    },
    {
      icon: <Truck className="h-10 w-10" />,
      title: "משלוח מהיר לישראל",
      description: "משלוח מהיר ומאובטח ישירות לדלת שלך בכל רחבי ישראל."
    },
    {
      icon: <IdCard className="h-10 w-10" />,
      title: "אחריות לכל החיים",
      description: "אנו עומדים מאחורי המוצרים שלנו עם אחריות מקיפה לכל החיים."
    }
  ];

  return (
    <>
      <Hero />
      
      {/* Main Features */}
      <section className="py-16 bg-[hsl(var(--cream))]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="slide-in flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 mb-4 text-[hsl(var(--gold))]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-serif mb-2">{feature.title}</h3>
                <p className="text-[hsl(var(--black-light))]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <ProductCategories />
      <FeaturedProducts />
      <AboutMoissanite />
      <Testimonials />
      <InstagramFeed />
      <Newsletter />
    </>
  );
}
