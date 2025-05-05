import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { 
  FacebookIcon, 
  InstagramIcon, 
  MapPinIcon, 
  PhoneIcon, 
  ClockIcon, 
  MailIcon,
} from "lucide-react";

const Footer = () => {
  const { t } = useTranslation();

  const categories = [
    { name: t("engagement_rings_footer"), path: "/products/rings" },
    { name: t("wedding_rings"), path: "/products/rings" },
    { name: t("necklaces_footer"), path: "/products/שרשראות" },
    { name: t("bracelets_footer"), path: "/products/צמידים" },
    { name: t("earrings_footer"), path: "/products/עגילים" },
    { name: t("special_collections"), path: "/products/collections" },
  ];

  const information = [
    { name: t("about_footer"), path: "/about" },
    { name: t("shipping_returns"), path: "/shipping-policy" },
    { name: t("disclosure"), path: "/disclosure" },
    { name: t("faq_footer"), path: "/faq" },
    { name: t("terms"), path: "/terms" },
    { name: t("privacy"), path: "/privacy" },
    { name: t("contact_footer"), path: "/contact" },
  ];

  const paymentIcons = [
    { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png", alt: "Visa" },
    { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png", alt: "Mastercard" },
    { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/2560px-PayPal.svg.png", alt: "PayPal" },
    { src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Payoneer_logo.svg/2560px-Payoneer_logo.svg.png", alt: "Payoneer" },
  ];

  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="mb-6">
              <img src="/ormia-gold-logo.png" alt="אור מיה תכשיטים" className="h-16" />
            </div>
            <p className="text-white/70 mb-6">{t("footer_desc")}</p>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="text-white hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-white hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-6">{t("categories")}</h4>
            <ul className="space-y-3">
              {categories.map((category, index) => (
                <li key={index}>
                  <Link 
                    href={category.path} 
                    className="text-white/70 hover:text-primary transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-6">{t("information")}</h4>
            <ul className="space-y-3">
              {information.map((item, index) => (
                <li key={index}>
                  <Link 
                    href={item.path} 
                    className="text-white/70 hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-medium mb-6">{t("contact_info")}</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-primary mt-1 ml-3" />
                <span className="text-white/70">{t("address")}</span>
              </li>
              <li className="flex items-start">
                <PhoneIcon className="h-5 w-5 text-primary mt-1 ml-3" />
                <span className="text-white/70">{t("phone")}</span>
              </li>
              <li className="flex items-start">
                <MailIcon className="h-5 w-5 text-primary mt-1 ml-3" />
                <span className="text-white/70">{t("email")}</span>
              </li>
              <li className="flex items-start">
                <ClockIcon className="h-5 w-5 text-primary mt-1 ml-3" />
                <span className="text-white/70">{t("hours")}</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/50 text-sm mb-4 md:mb-0">{t("copyright")}</p>
          <div className="flex gap-2">
            {paymentIcons.map((icon, index) => (
              <img 
                key={index} 
                src={icon.src} 
                alt={icon.alt} 
                className="h-8 w-auto"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
