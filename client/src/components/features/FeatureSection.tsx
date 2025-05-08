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
    <section ref={sectionRef} className="py-20 relative bg-cover bg-center">
      {/* Feature section background with improved styling */}
      <div className="absolute inset-0 hero-background">
        <div className="absolute inset-0 bg-black bg-opacity-95 bg-gradient-to-b from-black to-gray-900"></div>
        {/* Luxury background pattern */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffd700\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}></div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent z-10"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent z-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold mb-4 text-gold-gradient bg-white px-6 py-3 rounded-lg inline-block shadow-md border border-primary/20">למה לבחור באור מיה?</h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-800 bg-white px-4 py-2 rounded-lg inline-block shadow-md border border-primary/20">אנו מציעים את האיכות הגבוהה ביותר במחירים הוגנים, עם שירות אישי וחוויית קנייה מושלמת</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="slide-in flex flex-col items-center text-center p-8 relative group bg-white/95 backdrop-blur-sm rounded-lg shadow-md"
            >
              {/* Background decorations */}
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary/5 to-primary/0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative">
                {/* Icon with gold gradients and shadow effects */}
                <div className="w-20 h-20 mb-6 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5"></div>
                  <div className="relative hero-icon">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-2xl font-serif mb-4 text-gold-gradient bg-white px-4 py-2 rounded-lg shadow-sm border border-primary/10">{feature.title}</h3>
                <p className="text-foreground/90 leading-relaxed bg-white px-3 py-2 rounded-lg shadow-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
