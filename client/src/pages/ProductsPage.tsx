import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "wouter";

import MainLayout from "@/components/layout/MainLayout";
import ProductGrid from "@/components/products/ProductGrid";

const ProductsPage = () => {
  const { t } = useTranslation();
  const { category } = useParams();
  const [pageTitle, setPageTitle] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  
  useEffect(() => {
    // Set page title and description based on category
    if (category) {
      switch (category) {
        case "new":
          setPageTitle("חדש באתר");
          setPageDescription("גלו את הפריטים החדשים ביותר שנוספו לחנות שלנו, כולם מויסנייט באיכות גבוהה בעיצובים ייחודיים.");
          break;
        case "rings":
          setPageTitle(t("rings"));
          setPageDescription("גלו את קולקציית הטבעות היוקרתיות שלנו, המשלבות מויסנייט באיכות גבוהה עם עיצובים מודרניים וקלאסיים.");
          break;
        case "necklaces":
          setPageTitle(t("necklaces"));
          setPageDescription("שרשראות מויסנייט מרהיבות בעיצובים ייחודיים, מושלמות לכל אירוע מיוחד או כמתנה יוקרתית.");
          break;
        case "earrings":
          setPageTitle(t("earrings"));
          setPageDescription("עגילי מויסנייט מרהיבים שמשלבים יופי וברק יוצא דופן, מושלמים לכל אישה שאוהבת תכשיטים איכותיים.");
          break;
        case "bracelets":
          setPageTitle(t("bracelets"));
          setPageDescription("צמידי מויסנייט יוקרתיים בעיצובים ייחודיים, המשלבים זוהר ויופי לכל אירוע מיוחד.");
          break;
        case "engagement-rings":
          setPageTitle(t("engagement_rings"));
          setPageDescription("טבעות אירוסין מויסנייט בעיצוב ייחודי, מושלמות לרגע המיוחד ביותר בחיים ולשנים רבות לאחר מכן.");
          break;
        default:
          setPageTitle(category);
          setPageDescription("");
      }
    } else {
      setPageTitle("כל המוצרים");
      setPageDescription("גלו את מגוון התכשיטים היוקרתיים שלנו, כולם משלבים מויסנייט באיכות גבוהה עם עיצובים מודרניים וקלאסיים.");
    }
  }, [category, t]);

  return (
    <MainLayout>
      <div className="pt-16 md:pt-20">
        <div className="bg-gray-50 py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-serif mb-2">{pageTitle}</h1>
            <p className="text-foreground/70">{pageDescription}</p>
          </div>
        </div>
        
        <section className="py-12">
          <div className="container mx-auto px-4">
            <ProductGrid category={category} />
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default ProductsPage;
