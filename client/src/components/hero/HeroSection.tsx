import { useTranslation } from "react-i18next";
import { Link } from "wouter";
// Import the diamond background directly from public path instead of using assets
// This ensures it works without requiring build setup changes

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative h-screen w-full overflow-hidden hero-section">
      <div className="absolute inset-0 bg-black">
        <img 
          src="/images/falling-3d-diamonds-black-background_167862-5303.avif"
          alt="תכשיטי יוקרה מויסנייט" 
          className="w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50 z-[1]"></div>
        
        {/* Luxury overlay patterns */}
        <div className="absolute inset-0 opacity-10 z-[2]" style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}></div>
      </div>
      
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-end text-right z-10">
        {/* Main content */}
        <div className="animate-fadeIn">
          <h1 className="hero-heading text-5xl md:text-7xl font-serif text-white mb-6 tracking-tight">
            <span className="block mb-2">נוכחות שאי אפשר להתעלם ממנה.</span>
            <span className="hero-subheading block text-[#D4AF37] font-bold">תכשיטים שמאירים את הדרך ליוקרה בלתי נשכחת.</span>
          </h1>
          
          <p className="text-white/90 text-xl md:text-2xl max-w-lg mb-10 font-light leading-relaxed">
            {t("hero_description")}
          </p>
          
          <div className="hero-buttons flex flex-col sm:flex-row gap-5">
            <Link href="/products" className="hero-button-primary relative overflow-hidden bg-[#D4AF37] hover:bg-[#c19a36] text-white px-10 py-4 inline-block font-medium transition-all duration-300 text-center rounded-lg shadow-lg">
              <span className="relative z-10">גלה את הקולקציה</span>
            </Link>
            
            <Link href="/about" className="hero-button-secondary bg-black border border-white/30 hover:border-white text-white hover:bg-white/10 px-10 py-4 inline-block font-medium transition-all duration-300 text-center rounded-lg">
              קרא עוד
            </Link>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute left-10 bottom-20 w-32 h-32 border border-[#D4AF37]/20 rounded-full opacity-30"></div>
        <div className="absolute left-20 bottom-40 w-16 h-16 border border-[#D4AF37]/30 rounded-full opacity-20"></div>
      </div>
    </section>
  );
};

export default HeroSection;
