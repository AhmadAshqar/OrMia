import { useTranslation } from "react-i18next";
import { Link } from "wouter";

const TopBar = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-black text-white py-2 px-4 text-sm flex justify-between items-center">
      <div>
        <span>{t("free_shipping")}</span>
      </div>
      <div className="flex gap-6">
        <Link href="/login" className="hover:text-primary transition-colors">
          {t("login")}
        </Link>
        <Link href="/register" className="hover:text-primary transition-colors">
          {t("register")}
        </Link>
        <Link href="/faq" className="hover:text-primary transition-colors">
          {t("help")}
        </Link>
      </div>
    </div>
  );
};

export default TopBar;
