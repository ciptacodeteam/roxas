
"use client";

import Image from "next/image";

import bgCharacter from "public/img/background.webp";
import character from "public/img/character.webp";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const slides = [
  { id: 1, img: "/img/img1.webp" },
//   { id: 2, img: "/img/img1.webp" },
//   { id: 3, img: "/img/img1.webp" },
];

export default function HeroSection() {
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
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  return (
    <section className="bg-muted-foreground pt-38 pb-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-stretch gap-4">
          {/* LEFT SLIDER */}
          <div className="relative w-3/4 overflow-hidden rounded-2xl">
            {/* Embla viewport */}
            <div className="embla" ref={emblaRef}>
              <div className="embla__container flex">
                {slides.map((item) => (
                  <div className="embla__slide flex-[0_0_100%]" key={item.id}>
                    <div className="relative aspect-16/6 w-full overflow-hidden rounded-2xl">
                      <Image
                        src={item.img}
                        alt=""
                        fill
                        priority
                        className="object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DOT INDICATOR (animasi scale) */}
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {slides.map((_, index) => (
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
