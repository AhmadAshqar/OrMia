import { useTranslation } from "react-i18next";
import { useRef, useEffect } from "react";
import { GemIcon, TruckIcon, AwardIcon } from "lucide-react";

const FeatureSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Add animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Select all slide-in elements within this section
            const slideInElements = entry.target.querySelectorAll('.slide-in');
            slideInElements.forEach((el, index) => {
              // Add delay based on index
              setTimeout(() => {
                el.classList.add('slide-in-visible');
              }, index * 150);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const features = [
    {
      icon: <GemIcon className="h-12 w-12" />,
      title: t("feature_quality_title"),
      description: t("feature_quality_desc")
    },
    {
      icon: <TruckIcon className="h-12 w-12" />,
      title: t("feature_shipping_title"),
      description: t("feature_shipping_desc")
    },
    {
      icon: <AwardIcon className="h-12 w-12" />,
      title: t("feature_warranty_title"),
      description: t("feature_warranty_desc")
    }
  ];

  return (
    <section ref={sectionRef} className="py-20 relative bg-cover bg-center" style={{ backgroundImage: 'url("/diamond-dust-bg.jpg")' }}>
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
      
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold mb-4 text-gold-gradient bg-white/95 px-6 py-3 rounded-lg inline-block shadow-sm">למה לבחור באור מיה?</h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-800 bg-white/95 px-4 py-2 rounded-lg inline-block shadow-sm">אנו מציעים את האיכות הגבוהה ביותר במחירים הוגנים, עם שירות אישי וחוויית קנייה מושלמת</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="slide-in flex flex-col items-center text-center p-8 relative group bg-white/90 backdrop-blur-sm rounded-lg shadow-md"
            >
              {/* Background decorations */}
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary/5 to-primary/0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative">
                {/* Icon with gold gradients and shadow effects */}
                <div className="w-20 h-20 mb-6 text-primary flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-primary/5"></div>
                  <div className="relative">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-2xl font-serif mb-4 text-gold-gradient">{feature.title}</h3>
                <p className="text-foreground/80 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
