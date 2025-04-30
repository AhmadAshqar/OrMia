import { useTranslation } from "react-i18next";
import { Link } from "wouter";

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative h-[70vh] overflow-hidden animate-fade-in">
      <div className="absolute inset-0 bg-black">
        <img 
          src="https://images.unsplash.com/photo-1600003014755-ba31aa59c4b6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
          alt={t("hero_description")} 
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      </div>
      
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-center">
        <h1 className="text-4xl md:text-6xl font-serif text-white mb-4">
          <span className="block mb-2">{t("hero_title_1")}</span>
          <span className="block text-primary">{t("hero_title_2")}</span>
        </h1>
        <p className="text-white text-xl md:text-2xl max-w-lg mb-8 font-accent">{t("hero_description")}</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/products" className="bg-primary hover:bg-primary/80 text-black px-8 py-3 inline-block font-medium transition-colors duration-300 text-center">
            {t("discover_collection")}
          </Link>
          <Link href="/about" className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 inline-block font-medium transition-colors duration-300 text-center">
            {t("read_more")}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
