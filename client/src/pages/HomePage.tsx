import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import HeroSection from "@/components/hero/HeroSection";
import FeatureSection from "@/components/features/FeatureSection";
import FeaturedProducts from "@/components/products/FeaturedProducts";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Instagram, 
  Check, 
  Facebook,
  ArrowUp,
  Star
} from "lucide-react";

const HomePage = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    // Add scroll-to-top functionality
    const scrollButton = document.getElementById("scroll-to-top");
    const toggleScrollButton = () => {
      if (window.scrollY > 300) {
        scrollButton?.classList.remove("hidden");
      } else {
        scrollButton?.classList.add("hidden");
      }
    };
    
    window.addEventListener("scroll", toggleScrollButton);
    
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
      window.removeEventListener("scroll", toggleScrollButton);
    };
  }, []);

  return (
    <MainLayout>
      {/* Hero Section */}
      <HeroSection />
      
      {/* Feature Section - removed top padding as requested */}
      <div>
        <FeatureSection />
      </div>
      
      {/* Collections Section */}
      <section id="collections" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif mb-3">{t("our_collections")}</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="max-w-2xl mx-auto text-lg text-foreground/80">{t("collections_description")}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group relative overflow-hidden rounded-sm slide-in">
              <img 
                src="https://images.unsplash.com/photo-1574158622682-e40e69881006?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                alt={t("engagement_rings")} 
                className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
              <div className="absolute bottom-0 w-full p-6">
                <h3 className="text-2xl font-serif text-white mb-3">{t("engagement_rings")}</h3>
                <p className="text-white/80 mb-4">{t("engagement_rings_desc")}</p>
                <Link 
                  href="/products/engagement-rings" 
                  className="inline-block py-2 px-4 bg-primary/90 hover:bg-primary text-black font-medium transition-all duration-300"
                >
                  {t("view_collection")}
                </Link>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-sm slide-in">
              <img 
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1587&q=80" 
                alt={t("diamond_necklaces")} 
                className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
              <div className="absolute bottom-0 w-full p-6">
                <h3 className="text-2xl font-serif text-white mb-3">{t("diamond_necklaces")}</h3>
                <p className="text-white/80 mb-4">{t("diamond_necklaces_desc")}</p>
                <Link 
                  href="/products/necklaces" 
                  className="inline-block py-2 px-4 bg-primary/90 hover:bg-primary text-black font-medium transition-all duration-300"
                >
                  {t("view_collection")}
                </Link>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-sm slide-in">
              <img 
                src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80" 
                alt={t("luxury_earrings")} 
                className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
              <div className="absolute bottom-0 w-full p-6">
                <h3 className="text-2xl font-serif text-white mb-3">{t("luxury_earrings")}</h3>
                <p className="text-white/80 mb-4">{t("luxury_earrings_desc")}</p>
                <Link 
                  href="/products/earrings" 
                  className="inline-block py-2 px-4 bg-primary/90 hover:bg-primary text-black font-medium transition-all duration-300"
                >
                  {t("view_collection")}
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Link 
              href="/products" 
              className="gold-hover inline-block py-3 px-8 border-2 border-black hover:border-primary text-black font-medium transition-colors duration-300"
            >
              {t("all_collections")}
            </Link>
          </div>
        </div>
      </section>
      
      {/* Featured Products Section */}
      <FeaturedProducts />
      
      {/* About Moissanite Section */}
      <section id="about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="slide-in">
              <div className="relative flex justify-center items-center">
                <div className="absolute w-full h-full bg-gradient-to-b from-amber-50/10 to-amber-100/20 rounded-full opacity-60 blur-3xl"></div>
                <img 
                  src="./images/diamond-gemstone.png" 
                  alt="מויסנייט" 
                  className="w-3/4 mx-auto diamond-shine z-10 relative"
                />
              </div>
            </div>
            
            <div className="slide-in">
              <h2 className="text-3xl md:text-4xl font-serif mb-4">{t("about_title")}</h2>
              <div className="w-16 h-1 bg-primary mb-6"></div>
              <p className="text-foreground/80 mb-4 leading-relaxed">{t("about_desc_1")}</p>
              <p className="text-foreground/80 mb-6 leading-relaxed">{t("about_desc_2")}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-start">
                  <Check className="text-primary mt-1 ml-2" />
                  <p>{t("about_feature_1")}</p>
                </div>
                <div className="flex items-start">
                  <Check className="text-primary mt-1 ml-2" />
                  <p>{t("about_feature_2")}</p>
                </div>
                <div className="flex items-start">
                  <Check className="text-primary mt-1 ml-2" />
                  <p>{t("about_feature_3")}</p>
                </div>
                <div className="flex items-start">
                  <Check className="text-primary mt-1 ml-2" />
                  <p>{t("about_feature_4")}</p>
                </div>
              </div>
              
              <Button 
                asChild
                className="bg-black hover:bg-primary text-white"
              >
                <Link href="/about">
                  {t("discover_more")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif mb-3">{t("testimonials")}</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="max-w-2xl mx-auto text-lg text-foreground/80">{t("testimonials_desc")}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 shadow-sm rounded-sm slide-in">
              <div className="flex text-primary text-sm mb-4">
                <Star className="fill-primary" />
                <Star className="fill-primary" />
                <Star className="fill-primary" />
                <Star className="fill-primary" />
                <Star className="fill-primary" />
              </div>
              <p className="text-foreground/80 italic mb-4">"קניתי טבעת אירוסין מויסנייט והייתי המומה מהיופי והאיכות שלה. בת הזוג שלי פשוט התאהבה בה. השירות היה מעולה והמחיר היה הרבה יותר טוב מטבעות יהלום דומות."</p>
              <div className="flex items-center">
                <p className="font-medium">דניאל כהן</p>
                <span className="mx-2 text-primary">•</span>
                <p className="text-sm text-foreground/70">תל אביב</p>
              </div>
            </div>
            
            <div className="bg-white p-6 shadow-sm rounded-sm slide-in">
              <div className="flex text-primary text-sm mb-4">
                <Star className="fill-primary" />
                <Star className="fill-primary" />
                <Star className="fill-primary" />
                <Star className="fill-primary" />
                <Star className="fill-primary" />
              </div>
              <p className="text-foreground/80 italic mb-4">"עגילי המויסנייט שרכשתי פשוט מדהימים! הם נוצצים בצורה מרהיבה ומושכים תשומת לב חיובית בכל פעם שאני לובשת אותם. איכות גבוהה, משלוח מהיר ושירות לקוחות מצוין."</p>
              <div className="flex items-center">
                <p className="font-medium">לימור אברהם</p>
                <span className="mx-2 text-primary">•</span>
                <p className="text-sm text-foreground/70">חיפה</p>
              </div>
            </div>
            
            <div className="bg-white p-6 shadow-sm rounded-sm slide-in">
              <div className="flex text-primary text-sm mb-4">
                <Star className="fill-primary" />
                <Star className="fill-primary" />
                <Star className="fill-primary" />
                <Star className="fill-primary" />
                <Star className="fill-primary" />
              </div>
              <p className="text-foreground/80 italic mb-4">"קניתי צמיד טניס מויסנייט מתנה לאשתי ליום הנישואין שלנו. היא הייתה בהלם מהיופי שלו ולא האמינה למחיר. שירות מעולה וגם אריזת המתנה הייתה מהממת. ממליץ בחום!"</p>
              <div className="flex items-center">
                <p className="font-medium">יואב לוי</p>
                <span className="mx-2 text-primary">•</span>
                <p className="text-sm text-foreground/70">ירושלים</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Instagram Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif mb-3">{t("follow_instagram")}</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="max-w-2xl mx-auto text-lg text-foreground/80">{t("instagram_desc")}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Instagram Images - 6 of them */}
            {Array.from({ length: 6 }).map((_, i) => (
              <a href="#" key={i} className="block group relative overflow-hidden slide-in">
                <img 
                  src={`https://source.unsplash.com/random/300x300/?jewelry,diamond,${i}`}
                  alt={t("instagram_image")}
                  className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Instagram className="text-white text-3xl" />
                </div>
              </a>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <a 
              href="#" 
              className="inline-flex items-center text-primary hover:underline font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="h-5 w-5 mr-2" />
              {t("follow_us")}
            </a>
            <a 
              href="#" 
              className="inline-flex items-center text-primary hover:underline font-medium mr-6"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Facebook className="h-5 w-5 mr-2" />
              {t("like_us")}
            </a>
          </div>
        </div>
      </section>
      
      {/* Scroll to top button */}
      <button
        id="scroll-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-8 right-8 bg-primary text-black p-3 rounded-full shadow-lg opacity-80 hover:opacity-100 transition-all duration-300 z-50 hidden"
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-6 w-6" />
      </button>
    </MainLayout>
  );
};

export default HomePage;