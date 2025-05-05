import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Product } from "@shared/schema";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/products/ProductCard";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const NewProductsPage: React.FC = () => {
  const { t } = useTranslation();
  
  // Fetch all products
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Filter out only new products
  const newProducts = products?.filter(product => product.isNew) || [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl text-red-500">{t("error_loading_products")}</h2>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: "#FFD700" }}>NEW</h1>
          <p className="text-gray-300">{t("discover_new_arrivals")}</p>
        </div>

        {newProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl">{t("no_new_products")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {newProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default NewProductsPage;