 
"use client";

import { useState, useEffect } from "react";
import { useCategories, useProducts } from "@/lib/queries";
import GameTabs from "./GameTabs";
import GameGrid from "./GameGrid";

interface Product {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  slug: string;
  description?: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function GameSection() {
  // Fetch categories using TanStack Query
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  // Extract category names
  const categories = categoriesData?.map((cat: { name: string }) => cat.name) || [];
  
  // Fallback to default categories if API fails
  const displayCategories = categories.length > 0 
    ? categories 
    : ["Games", "Voucher & Hiburan", "Pulsa & PLN"];

  // Set default active category
  const [active, setActive] = useState<string>(displayCategories[0] || "");
  
  useEffect(() => {
    if (displayCategories.length > 0 && !displayCategories.includes(active)) {
      setActive(displayCategories[0]);
    }
  }, [displayCategories, active]);

  // Fetch products when active category changes
  const {
    data: products = [],
    isLoading: productsLoading,
    error: productsError,
  } = useProducts(
    active ? { categoryName: active } : undefined,
    {
      enabled: !!active, // Only fetch when active category is set
    }
  );

  const loading = categoriesLoading || productsLoading;
  const error = categoriesError || productsError;

  return (
    <section className="mx-auto max-w-7xl mb-16">
      {!loading && (
        <>
          <GameTabs categories={displayCategories} active={active} setActive={setActive} />
          <GameGrid items={products} />
        </>
      )}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-white">Loading products...</p>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center py-12">
          <p className="text-red-400">Error loading products. Please try again.</p>
        </div>
      )}
    </section>
  );
}
