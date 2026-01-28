/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useCategories, useProducts } from "@/lib/queries";
import GameTabs from "./GameTabs";
import GameGrid from "./GameGrid";
import { GameSectionSkeleton } from "../skeletons";

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

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function GameSection() {
  // Fetch categories using TanStack Query
  const {
    data: categoriesData = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesErrorMessage,
  } = useCategories();

  // Extract category names with proper typing
  const categories: string[] = Array.isArray(categoriesData)
    ? categoriesData.map((cat: Category) => cat.name)
    : [];

  // Fallback to default categories if API fails
  const displayCategories = categories.length > 0
    ? categories
    : ["Games", "Voucher & Hiburan", "Pulsa & PLN"];

  // Set default active category
  const [active, setActive] = useState<string>(displayCategories[0] || "");

  useEffect(() => {
    if (displayCategories.length > 0 && !displayCategories.includes(active)) {
      setActive(displayCategories[0]!);
    }
  }, [displayCategories, active]);

  // Fetch products when active category changes
  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorMessage,
  } = useProducts(
    active ? { categoryName: active } : undefined,
    {
      enabled: !!active, // Only fetch when active category is set
    }
  );

  const isLoading = categoriesLoading || productsLoading;
  const hasError = categoriesError || productsError;
  const errorMessage = categoriesErrorMessage?.message || productsErrorMessage?.message;

  // Show skeleton while loading
  if (isLoading) {
    return <GameSectionSkeleton />;
  }

  // Show error state
  if (hasError) {
    return (
      <section className="mx-auto max-w-7xl mb-16">
        <div className="flex items-center justify-center py-12">
          <p className="text-red-400">
            {errorMessage || "Error loading products. Please try again."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto lg:max-w-7xl w-11/12 lg:mb-16 mb-12">
      <GameTabs
        categories={displayCategories}
        active={active}
        setActive={setActive}
      />
      {products.length > 0 ? (
        <GameGrid items={products} />
      ) : (
        <div className="flex items-center justify-center py-12">
          <p className="text-white">No products available in this category.</p>
        </div>
      )}
    </section>
  );
}
