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

  // Extract categories with proper typing
  const categories: Category[] = Array.isArray(categoriesData)
    ? categoriesData.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      }))
    : [];

  // Fallback to default categories if API fails
  const displayCategories = categories.length > 0
    ? categories
    : [
        { id: "1", name: "Games", slug: "games" },
        { id: "2", name: "Voucher & Hiburan", slug: "voucher-hiburan" },
        { id: "3", name: "Pulsa & PLN", slug: "pulsa-pln" }
      ];

  // Set default active category (use full category object)
  const [activeCategory, setActiveCategory] = useState<Category>(displayCategories[0]!);

  useEffect(() => {
    if (displayCategories.length > 0 && !displayCategories.find(cat => cat.slug === activeCategory.slug)) {
      setActiveCategory(displayCategories[0]!);
    }
  }, [displayCategories, activeCategory]);

  // Fetch products when active category changes (use categorySlug for Django)
  const {
    data: productsData = [],
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorMessage,
  } = useProducts(
    activeCategory ? { categorySlug: activeCategory.slug } : undefined,
    {
      enabled: !!activeCategory, // Only fetch when active category is set
    }
  );

  // Transform products to match expected format (Django returns snake_case)
  const products = Array.isArray(productsData) 
    ? productsData.map((product: any) => ({
        id: product.id,
        title: product.name,
        subtitle: product.category_name || "",
        image: product.image || "/img/icon1.webp",
        slug: product.slug,
        description: product.description,
        category: {
          id: product.category || "",
          name: product.category_name || "",
          slug: ""
        }
      }))
    : [];

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
        categories={displayCategories.map(cat => cat.name)}
        active={activeCategory.name}
        setActive={(name: string) => {
          const category = displayCategories.find(cat => cat.name === name);
          if (category) {
            setActiveCategory(category);
          }
        }}
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
