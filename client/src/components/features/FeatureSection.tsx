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
      icon: <GemIcon className="h-10 w-10" />,
      title: t("feature_quality_title"),
      description: t("feature_quality_desc")
    },
    {
      icon: <TruckIcon className="h-10 w-10" />,
      title: t("feature_shipping_title"),
      description: t("feature_shipping_desc")
    },
    {
      icon: <AwardIcon className="h-10 w-10" />,
      title: t("feature_warranty_title"),
      description: t("feature_warranty_desc")
    }
  ];

  return (
    <section ref={sectionRef} className="py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="slide-in flex flex-col items-center text-center p-6">
              <div className="w-16 h-16 mb-4 text-primary flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-serif mb-2">{feature.title}</h3>
              <p className="text-foreground/80">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
