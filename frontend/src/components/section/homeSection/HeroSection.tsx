/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

"use client";

import Image from "next/image";
import Link from "next/link";

import bgCharacter from "public/img/background.webp";
import character from "public/img/character.webp";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";

import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useMarketingBanners } from "@/lib/queries";
import { HeroSkeleton } from "./skeletons";

interface MarketingBanner {
  id: string;
  title: string | null;
  image: string;
  link: string | null;
  description: string | null;
}

const DEFAULT_BANNER: MarketingBanner = {
  id: "1",
  title: null,
  image: "/img/img1.webp",
  link: null,
  description: null,
};

export default function HeroSection() {
  const {
    data: bannersData,
    isLoading,
    isError,
    error,
  } = useMarketingBanners();

  const autoplay = useRef(
    Autoplay({
      delay: 3000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    }),
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    autoplay.current,
  ]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Use banners from query or fallback to default
  const banners: MarketingBanner[] = useMemo(() => {
    if (bannersData && Array.isArray(bannersData) && bannersData.length > 0) {
      return bannersData;
    }
    return [DEFAULT_BANNER];
  }, [bannersData]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  // Update carousel when banners change
  useEffect(() => {
    if (emblaApi && banners.length > 0) {
      emblaApi.reInit();
    }
  }, [emblaApi, banners]);

  // Show skeleton while loading
  if (isLoading) {
    return <HeroSkeleton />;
  }

  // Show error state
  if (isError) {
    return (
      <section className="bg-muted-foreground pt-38 pb-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-stretch gap-4">
            <div className="relative w-3/4 overflow-hidden rounded-2xl">
              <div className="relative aspect-16/6 w-full overflow-hidden rounded-2xl bg-gray-800 flex items-center justify-center">
                <div className="text-red-400">
                  {error?.message || "Failed to load banners"}
                </div>
              </div>
            </div>
            <div className="w-1/4">
              <div className="bg-card rounded-2xl h-full" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-muted-foreground lg:pt-38 pt-24 lg:pb-14 pb-6">
      <div className="mx-auto lg:max-w-7xl w-11/12">
        <div className="flex items-stretch gap-4">
          {/* LEFT SLIDER */}
          <div className="relative lg:w-3/4 w-full overflow-hidden lg:rounded-2xl rounded-md">
            {/* Embla viewport */}
            <div className="embla" ref={emblaRef}>
              <div className="embla__container flex">
                {banners.map((banner) => {
                  const slideContent = (
                    <div className="relative aspect-16/6 w-full overflow-hidden lg:rounded-2xl rounded-md">
                      <Image
                        src={banner.image || "/img/img1.webp"}
                        alt={banner.title || banner.description || "Banner"}
                        fill
                        priority
                        className="object-cover"
                      />
                    </div>
                  );

                  return (
                    <div className="embla__slide flex-[0_0_100%]" key={banner.id}>
                      {banner.link ? (
                        <Link href={banner.link} className="block">
                          {slideContent}
                        </Link>
                      ) : (
                        slideContent
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DOT INDICATOR */}
            {banners.length > 1 && (
              <div className="absolute lg:bottom-4 bottom-2 left-1/2 z-20 flex -translate-x-1/2 lg:gap-2 gap-1">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    aria-label={`Go to banner ${index + 1}`}
                    className={`lg:h-3 lg:w-3 h-2 w-2 rounded-full transition-all duration-300 ${selectedIndex === index
                        ? "bg-primary lg:w-6 w-4 scale-110 opacity-100"
                        : "scale-90 bg-white/40 opacity-60"
                      } `}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT CARD */}
          <div className="w-1/4 lg:block hidden">
            <div className="group relative h-full overflow-hidden rounded-2xl">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <Image
                  alt="Background"
                  src={bgCharacter}
                  fill
                  priority
                  className="rounded-2xl object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <Image
                  alt="Character"
                  src={character}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 scale-[1.3] transition-transform duration-500 ease-out group-hover:scale-[1.4]"
                />
              </div>

              <div className="absolute right-0 bottom-0 left-0">
                <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-56 bg-linear-to-t from-black/80"></div>

                <div className="relative z-10 p-5 text-white">
                  <h3 className="mb-1 text-3xl font-semibold">Join Reseller</h3>
                  <p className="text-sm opacity-90">
                    Sudah lebih dari 100+ telah bergabung.
                  </p>
                </div>

                <div className="relative z-10">
                  <Button className="bg-primary w-full cursor-pointer rounded-none py-6 font-semibold text-white hover:bg-primary/90">
                    Hubungi Kami
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
