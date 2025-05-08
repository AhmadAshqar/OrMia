import { useTranslation } from "react-i18next";
import { useRef, useEffect } from "react";
import { GemIcon, TruckIcon, AwardIcon } from "lucide-react";
import glitterBg from "@assets/close-up-glitter-decoration-detail_23-2149048285.avif";
import diamondBg from "@assets/falling-3d-diamonds-black-background_167862-5303.avif";

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
      icon: <GemIcon className="h-12 w-12 text-[#D4AF37]" />,
      title: t("feature_quality_title"),
      description: t("feature_quality_desc")
    },
    {
      icon: <TruckIcon className="h-12 w-12 text-[#D4AF37]" />,
      title: t("feature_shipping_title"),
      description: t("feature_shipping_desc")
    },
    {
      icon: <AwardIcon className="h-12 w-12 text-[#D4AF37]" />,
      title: t("feature_warranty_title"),
      description: t("feature_warranty_desc")
    }
  ];

  return (
    <section ref={sectionRef} className="section-background py-20 relative bg-cover bg-center" style={{ backgroundImage: `url(${glitterBg})` }}>
      {/* Dark overlay gradient - only applies to background */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-black/50 to-black/70 z-[1]"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent z-[2]"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent z-[2]"></div>
      
      {/* Content container with higher z-index to stay above the overlay */}
      <div className="container mx-auto px-4 relative z-[10]">
        <div className="text-center mb-16">
          <h2 className="section-title text-4xl font-serif font-bold mb-4 text-[#D4AF37] px-6 py-3 rounded-lg inline-block shadow-xl bg-black/60 backdrop-blur-sm border border-[#D4AF37]/30">למה לבחור באור מיה?</h2>
          <p className="max-w-2xl mx-auto text-lg text-white px-4 py-2 rounded-lg inline-block shadow-xl bg-black/60 backdrop-blur-sm border border-[#D4AF37]/30">אנו מציעים את האיכות הגבוהה ביותר במחירים הוגנים, עם שירות אישי וחוויית קנייה מושלמת</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="card slide-in flex flex-col items-center text-center p-8 relative group bg-white/90 backdrop-blur-sm rounded-lg shadow-xl hover:transform hover:-translate-y-2 transition-all duration-300 border border-white/10"
            >
              {/* Background decorations */}
              <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative">
                {/* Icon with gold gradients and shadow effects */}
                <div className="card-icon w-20 h-20 mb-6 text-[#D4AF37] flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4AF37]/10 to-[#D4AF37]/5"></div>
                  <div className="relative">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="card-title text-2xl font-serif mb-4 text-gold-gradient px-4 py-2 rounded-lg shadow-sm border border-[#D4AF37]/10">{feature.title}</h3>
                <p className="card-text text-[#333] leading-relaxed px-3 py-2 rounded-lg shadow-sm">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
