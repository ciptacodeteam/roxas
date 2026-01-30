"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Zap } from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

interface ProductData {
  id: string;
  name: string;
  slug: string;
}

interface FlashSaleItem {
  id: string;
  flash_sale: string;
  product_item: string;
  product_item_name: string;
  product_name: string;
  product_slug: string;
  icon_image: string | null;
  sale_price: number;
  normal_price: number;
  discount_percentage: number;
  stock: number;
  sold_count: number;
}

export default function MarqueeCards() {
  const [items, setItems] = useState<FlashSaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();

  useEffect(() => {
    const fetchFlashSales = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const response = await fetch(`${apiUrl}/api/v1/flash-sales/`);
        const data = await response.json();

        // Handle Django paginated response
        const flashSales = data.results || data;
        
        if (Array.isArray(flashSales) && flashSales.length > 0) {
          const allItems = flashSales.flatMap(
            (sale: any) => sale.items || []
          );
          setItems(allItems);
        }
      } catch (error) {
        console.error("Failed to fetch flash sales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashSales();
  }, []);

  if (loading) {
    return (
      <div className="pb-8">
        <div className="animate-pulse flex gap-4 px-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-80 h-48 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pb-8 px-8 text-center text-gray-400">
        <p>No flash sales available at the moment</p>
      </div>
    );
  }

  // Only duplicate items if there are less than 4 items for smooth marquee effect
  const displayItems = items.length < 4 ? [...items, ...items] : items;

  return (
    <div className="overflow-hidden pb-8">
      <Marquee speed={30} gradient={false} pauseOnHover>
        {displayItems.map((item, i) => {
          // Use snake_case fields from Django backend
          const itemName = item.product_item_name;
          const productName = item.product_name;
          const originalPrice = item.normal_price;
          const salePrice = item.sale_price;
          const soldCount = item.sold_count;
          const discount = item.discount_percentage || 0;
          
          // Use product_slug from backend
          const productSlug = item.product_slug;
          const iconImage = item.icon_image || "/img/icon1.webp";

          const progress = Math.min(
            100,
            Math.round((soldCount / item.stock) * 100)
          );

          const productUrl = `/${locale}/product/${productSlug}`;

          return (
            <Link
              key={i}
              href={productUrl}
              className="block"
            >
              <Card
                className="relative bg-no-repeat mr-4 w-80 border-card overflow-hidden rounded-xl bg-[url(/img/bgroxas.webp)] bg-cover transition-all duration-300 hover:border-primary cursor-pointer"
              >
                <div className="absolute inset-0 bg-rose-950/60" />

                <CardHeader className="z-10">
                  <div>
                    <h1 className="text-xl font-medium text-white">
                      {itemName}
                    </h1>
                    <p className="text-sm text-white">{productName}</p>
                  </div>

                  <div className="z-10 mt-3 flex items-center gap-4">
                    <div>
                      <Image
                        src={iconImage}
                        alt={itemName}
                        width={80}
                        height={80}
                        className="rounded-sm"
                      />
                    </div>
                    <div>
                      <div>
                        <p className="text-xl font-semibold text-white">
                          Rp {salePrice.toLocaleString("id-ID")}
                        </p>
                        <p className="text-sm text-red-400 line-through">
                          Rp {originalPrice.toLocaleString("id-ID")}
                        </p>
                      </div>

                      {discount > 0 && (
                        <span className="bg-primary w-fit rounded-md px-2 py-0.5 text-xs font-bold text-white">
                          -{discount}%
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 pb-12">
                  <div className="h-2 w-full rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-yellow-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="mt-2 text-right text-xs text-white">
                    {soldCount} / {item.stock} purchased
                  </p>
                </CardContent>

                <CardFooter className="absolute bottom-0 left-0 right-0 z-10 flex justify-between text-xs text-white bg-background py-4">
                  <div className="flex items-center gap-1">
                    <Zap className="size-5 text-yellow-400" />
                    <span>Pengiriman CEPAT</span>
                  </div>
                  <span className="rounded-sm bg-primary px-3 py-1 text-xs text-white">
                    Hemat Rp {(originalPrice - salePrice).toLocaleString("id-ID")}
                  </span>
                </CardFooter>
              </Card>
            </Link>
          );
        })}
      </Marquee>
    </div>
  );
}
