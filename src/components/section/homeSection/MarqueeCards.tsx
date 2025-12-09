"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Zap } from "lucide-react";

import Image from "next/image";

import Marquee from "react-fast-marquee";

const items = [
  {
    id: 1,
    title: "1155 Diamonds",
    product: "Magic Chess: Go Go",
    image: "/img/icon1.webp",
    price: 378395,
    oldPrice: 400008,
    sold: 158,
    stock: 300,
  },
  {
    id: 2,
    title: "Weekly Pass",
    product: "Mobile Legends",
    image: "/img/icon1.webp",
    price: 299000,
    oldPrice: 340000,
    sold: 92,
    stock: 300,
  },
  {
    id: 3,
    title: "(200 + 768 UC PASS) 24 Jam",
    product: "PUBG Mobile",
    image: "/img/icon1.webp",
    price: 125000,
    oldPrice: 150000,
    sold: 201,
    stock: 300,
  },
  {
    id: 4,
    title: "Membership 10 bulan",
    product: "Genshin Impact",
    image: "/img/icon1.webp",
    price: 89000,
    oldPrice: 100000,
    sold: 45,
    stock: 300,
  },
];

const loopItems = [...items, ...items];

export default function MarqueeCards() {
  return (
    <div className="overflow-hidden pb-8">
      <Marquee speed={30} gradient={false} pauseOnHover>
        {loopItems.map((item, i) => {
          const discount =
            item.oldPrice > item.price
              ? Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)
              : 0;

          const progress = Math.min(
            100,
            Math.round((item.sold / item.stock) * 100),
          );

          return (
            <Card
              key={i}
              className="relative bg-no-repeat mr-4 w-80 border-card overflow-hidden rounded-xl bg-[url(/img/bgroxas.webp)] bg-cover transition-all duration-300 hover:border-primary cursor-pointer"
            >
              <div className="absolute inset-0 bg-rose-950/60" />

              <CardHeader className="z-10">
                <div>
                  <h1 className="text-xl font-medium text-white">
                    {item.title}
                  </h1>
                  <p className="text-sm text-white">{item.product}</p>
                </div>

                <div className="z-10 mt-3 flex items-center gap-4">
                  <div>
                    <Image
                      src={item.image}
                      alt="icon"
                      width={80}
                      height={80}
                      className="rounded-sm"
                    />
                  </div>
                  <div>
                    <div>
                      <p className="text-xl font-semibold text-white">
                        Rp {item.price.toLocaleString("id-ID")}
                      </p>
                      <p className="text-sm text-red-400 line-through">
                        Rp {item.oldPrice.toLocaleString("id-ID")}
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
                  {item.sold} / {item.stock} purchased
                </p>
              </CardContent>

              <CardFooter className="absolute bottom-0 left-0 right-0 z-10 flex justify-between text-xs text-white bg-background py-4">
                <div className="flex items-center gap-1">
                    <Zap className="size-5 text-yellow-400"/><span>Pengiriman CEPAT</span>
                </div>
                <span className="rounded-sm bg-primary px-3 py-1 text-xs text-white">
                  Hemat Rp{" "}
                  {(item.oldPrice - item.price).toLocaleString("id-ID")}
                </span>
              </CardFooter>
            </Card>
          );
        })}
      </Marquee>
    </div>
  );
}
