 
"use client";

import { useState } from "react";
import GameTabs from "./GameTabs";
import GameGrid from "./GameGrid";
import { categories } from "@/lib/data/categories";
import { productData } from "@/lib/data/productItems";


export default function GameSection() {
  const [active, setActive] = useState("Semua");

  return (
    <section className="mx-auto max-w-7xl mb-16">
      <GameTabs categories={categories} active={active} setActive={setActive} />

      <GameGrid items={productData[active as keyof typeof productData]} />
    </section>
  );
}
