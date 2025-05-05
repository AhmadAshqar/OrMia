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

  const navLinks = [
    { name: "דף הבית", path: "/" },
    { name: "NEW", path: "/products/new", isHighlighted: true },
    { name: "טבעות", path: "/products/rings" },
    { name: "שרשראות", path: "/products/necklaces" },
    { name: "עגילים", path: "/products/earrings" },
    { name: "צמידים", path: "/products/bracelets" },
    { name: "אודות", path: "/about" },
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
            <h4 className="text-lg font-medium mb-6">{t("navigation")}</h4>
            <ul className="space-y-3">
              {navLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.path} 
                    className={cn(
                      "text-white/70 hover:text-primary transition-colors",
                      link.isHighlighted ? "font-bold text-[#FFD700]" : ""
                    )}
                  >
                    {link.name}
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
        
        <div className="border-t border-white/10 mt-12 pt-8 flex justify-center">
          <p className="text-white/50 text-sm">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
