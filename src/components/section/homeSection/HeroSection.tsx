
"use client";

import Image from "next/image";
import Link from "next/link";

import bgCharacter from "public/img/background.webp";
import character from "public/img/character.webp";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface MarketingBanner {
  id: string;
  title: string | null;
  image: string;
  link: string | null;
  description: string | null;
}

export default function HeroSection() {
  const [banners, setBanners] = useState<MarketingBanner[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch("/api/marketing-banners");
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setBanners(data.data);
        } else {
          // Fallback to default banner if no banners found
          setBanners([{ id: "1", title: null, image: "/img/img1.webp", link: null, description: null }]);
        }
      } catch (error) {
        console.error("Error fetching marketing banners:", error);
        // Fallback to default banner on error
        setBanners([{ id: "1", title: null, image: "/img/img1.webp", link: null, description: null }]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

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

  return (
    <section className="bg-muted-foreground pt-38 pb-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-stretch gap-4">
          {/* LEFT SLIDER */}
          <div className="relative w-3/4 overflow-hidden rounded-2xl">
            {loading ? (
              <div className="relative aspect-16/6 w-full overflow-hidden rounded-2xl bg-gray-800 flex items-center justify-center">
                <div className="text-white">Loading banners...</div>
              </div>
            ) : banners.length > 0 ? (
              <>
                {/* Embla viewport */}
                <div className="embla" ref={emblaRef}>
                  <div className="embla__container flex">
                    {banners.map((banner) => {
                      const slideContent = (
                        <div className="relative aspect-16/6 w-full overflow-hidden rounded-2xl">
                          <Image
                            src={banner.image}
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

                {/* DOT INDICATOR (animasi scale) */}
                {banners.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                    {banners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => emblaApi?.scrollTo(index)}
                        className={`h-3 w-3 rounded-full transition-all duration-300 ${
                          selectedIndex === index
                            ? "bg-primary w-6 scale-110 opacity-100"
                            : "scale-90 bg-white/40 opacity-60"
                        } `}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="relative aspect-16/6 w-full overflow-hidden rounded-2xl bg-gray-800 flex items-center justify-center">
                <div className="text-white">No banners available</div>
              </div>
            )}
          </div>

          {/* RIGHT CARD — tidak berubah */}
          <div className="w-1/4">
            <div className="group relative h-full overflow-hidden rounded-2xl">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <Image
                  alt=""
                  src={bgCharacter}
                  fill
                  priority
                  className="rounded-2xl object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>

              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <Image
                  alt=""
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
                  <Button className="bg-primary w-full cursor-pointer rounded-none py-6 font-semibold text-white">
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
