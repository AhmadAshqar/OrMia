import { useTranslation } from "react-i18next";
import { Link } from "wouter";

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-black">
        <img 
          src="https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
          alt={t("hero_description")} 
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
        
        {/* Luxury overlay patterns */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}></div>
      </div>
      
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-center items-end text-right">
        {/* Gold decorative element */}
        <div className="absolute top-1/3 right-10 w-20 h-1 bg-primary transform -rotate-45 opacity-80"></div>
        
        <h1 className="text-4xl md:text-7xl font-serif text-white mb-6 tracking-tight">
          <span className="block mb-2">{t("hero_title_1")}</span>
          <span className="block text-gold-gradient font-bold">{t("hero_title_2")}</span>
        </h1>
        
        <p className="text-white/90 text-xl md:text-2xl max-w-lg mb-10 font-light leading-relaxed">{t("hero_description")}</p>
        
        <div className="flex flex-col sm:flex-row gap-5">
          <Link href="/products" className="relative overflow-hidden bg-primary hover:bg-primary/90 text-black px-10 py-4 inline-block font-medium transition-all duration-300 text-center border border-primary/20 shadow-lg hover:shadow-primary/20 hover:shadow-xl">
            <span className="relative z-10">{t("discover_collection")}</span>
            <span className="absolute inset-0 bg-white/10 transform scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100"></span>
          </Link>
          
          <Link href="/about" className="border border-white/30 hover:border-white text-white hover:bg-white/10 px-10 py-4 inline-block font-medium transition-all duration-300 text-center">
            {t("read_more")}
          </Link>
        </div>
        
        {/* Floating decoration */}
        <div className="absolute left-10 bottom-20 w-32 h-32 border border-primary/20 rounded-full opacity-30"></div>
        <div className="absolute left-20 bottom-40 w-16 h-16 border border-primary/30 rounded-full opacity-20"></div>
      </div>
    </section>
  );
};

export default HeroSection;
