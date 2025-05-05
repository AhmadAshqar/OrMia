import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { FacebookIcon, InstagramIcon } from "lucide-react";

const Footer = () => {
  const { t } = useTranslation();
  const [location] = useLocation();
  
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
        <div className="flex flex-col items-center">
          <div className="mb-8">
            <img src="/ormia-gold-logo.png" alt="אור מיה תכשיטים" className="h-16" />
          </div>
          
          <nav className="flex flex-wrap justify-center gap-8 mb-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={cn(
                  "font-medium transition-colors text-white hover:text-primary",
                  location === link.path ? "text-primary" : "",
                  link.isHighlighted ? "font-bold text-[#FFD700]" : ""
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {information.map((item, index) => (
              <Link 
                key={index}
                href={item.path} 
                className="text-white/70 hover:text-primary transition-colors text-sm"
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="flex gap-4 mb-8">
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
        
        <div className="border-t border-white/10 mt-6 pt-8 flex justify-center">
          <p className="text-white/50 text-sm">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
