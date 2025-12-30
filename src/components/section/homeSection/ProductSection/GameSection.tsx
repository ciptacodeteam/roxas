 
"use client";

import { useState, useEffect } from "react";
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
  const [categories, setCategories] = useState<string[]>([]);
  const [active, setActive] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();

        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          // Map database categories to category names (without "Semua")
          const categoryNames = data.data.map((cat: { name: string }) => cat.name);
          setCategories(categoryNames);
          
          // Set the first category as default
          setActive(categoryNames[0]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to default categories if API fails (without "Semua")
        const fallbackCategories = ["Games", "Voucher & Hiburan", "Pulsa & PLN"];
        setCategories(fallbackCategories);
        setActive(fallbackCategories[0] || "Games");
      }
    };

    fetchCategories();
  }, []);

  // Fetch products when active category changes
  useEffect(() => {
    if (!active) return; // Don't fetch if no active category is set

    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Always filter by category name
        const url = `/api/products?categoryName=${encodeURIComponent(active)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [active]);

  return (
    <section className="mx-auto max-w-7xl mb-16">
      {!loading && (
        <>
          <GameTabs categories={categories} active={active} setActive={setActive} />
          <GameGrid items={products} />
        </>
      )}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <p className="text-white">Loading products...</p>
        </div>
      )}
    </section>
  );
}
