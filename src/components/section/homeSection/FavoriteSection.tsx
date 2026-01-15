"use client";

"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useProducts } from "@/lib/queries";
import { FavoriteSectionSkeleton } from "./skeletons";

import fire from "public/gif/fire.gif";

interface Product {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  slug: string;
}

export default function FavoriteSection() {
  const locale = useLocale();
  const {
    data: games = [],
    isLoading,
    isError,
    error,
  } = useProducts({ limit: 6 });

  // Show skeleton while loading
  if (isLoading) {
    return <FavoriteSectionSkeleton />;
  }

  // Show error state
  if (isError) {
    return (
      <section>
        <div className="mx-auto mb-16 max-w-7xl">
          <div>
            <div className="mb-2 flex gap-2 text-3xl">
              <span>
                <Image src={fire} alt="fire" className="w-8" />
              </span>
              <p className="font-medium text-white">POPULER SEKARANG !</p>
            </div>
            <p className="text-white">Silahkan Temukan Game Kamu.</p>
          </div>
          <div className="mt-8 flex items-center justify-center py-12">
            <p className="text-red-400">
              {error?.message || "Failed to load products. Please try again."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mx-auto mb-16 max-w-7xl">
        <div>
          <div className="mb-2 flex gap-2 text-3xl">
            <span>
              <Image src={fire} alt="fire" className="w-8" />
            </span>
            <p className="font-medium text-white">POPULER SEKARANG !</p>
          </div>
          <p className="text-white">Silahkan Temukan Game Kamu.</p>
        </div>

        {games && games.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game: Product) => (
              <Link
                key={game.id}
                href={`/${locale}/product/${game.slug}`}
                prefetch
              >
                <Card className="hover:border-primary border-background relative cursor-pointer overflow-hidden rounded-xl bg-[url(/img/bgroxas.webp)] bg-cover bg-center py-1 transition-all hover:shadow-lg">
                  {/* overlay */}
                  <div className="absolute inset-0 bg-rose-950/60"></div>

                  <CardContent className="relative z-10 flex items-center gap-4 p-4">
                    <Image
                      src={game.image}
                      alt={game.title}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-lg object-cover"
                    />

                    <div className="flex flex-col justify-center">
                      <p className="text-xl font-semibold text-white">
                        {game.title}
                      </p>
                      <p className="text-sm text-white/70">{game.subtitle}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center py-12">
            <p className="text-white">No products available</p>
          </div>
        )}
      </div>
    </section>
  );
}
