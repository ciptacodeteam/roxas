 
"use client";

import { useState, useEffect } from "react";
import GameTabs from "./GameTabs";
import GameGrid from "./GameGrid";
import { productData } from "@/lib/data/productItems";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export default function GameSection() {
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [active, setActive] = useState("Semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          // Map database categories to category names
          const categoryNames = ["Semua", ...data.data.map((cat: Category) => cat.name)];
          setCategories(categoryNames);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to default categories if API fails
        setCategories(["Semua", "Games", "Voucher & Hiburan", "Pulsa & PLN"]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="mx-auto max-w-7xl mb-16">
      {!loading && (
        <>
          <GameTabs categories={categories} active={active} setActive={setActive} />
          <GameGrid items={productData[active as keyof typeof productData] || productData.Semua} />
        </>
      )}
    </section>
  );
}
