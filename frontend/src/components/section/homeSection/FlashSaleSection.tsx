"use client";

import { useEffect, useState } from "react";
import MarqueeCards from "./MarqueeCards";
import Image from "next/image";
import { FlashSaleSectionSkeleton } from "./skeletons";
import { useActiveFlashSales } from "@/lib/queries";

import electric from "public/gif/electric.gif";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const INITIAL_TIME: TimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
};

function useFlashSaleCountdown(endTime: Date | null) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(INITIAL_TIME);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (!endTime) return;

    // Immediate update
    const calculateTimeLeft = (): TimeLeft => {
      const now = Date.now();
      const end = new Date(endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        return INITIAL_TIME;
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return { timeLeft, isClient };
}

const pad = (num: number): string => String(num).padStart(2, "0");

export default function FlashSaleSection() {
  const { data, isLoading } = useActiveFlashSales();
  const flashSale = data?.[0];
  const endTime = flashSale?.end_time || null;
  const { timeLeft, isClient } = useFlashSaleCountdown(endTime);

  if (!isClient || isLoading) {
    return <FlashSaleSectionSkeleton />;
  }

  // If there's no flash sale data at all
  if (!data || data.length === 0 || !flashSale) {
    return null;
  }

  return (
    <section>
      <div className="mx-auto mt-12 max-w-7xl mb-16">
        <div className="bg-card rounded-xl">
          <div className="flex items-center justify-between p-8">
            <div>
              <div className="mb-2 flex gap-2 text-3xl">
                <span>
                  <Image src={electric} alt="flash sale icon" className="w-8" />
                </span>
                <p className="font-medium text-white">FLASH SALE</p>
              </div>
              <p className="text-white">Pesan sekarang! Persediaan terbatas.</p>
            </div>

            {/* COUNTDOWN BOX */}
            <div className="flex gap-2">
              {/* DAYS */}
              <div className="w-14 rounded-lg bg-white/10 p-3 text-center text-white">
                <p className="text-xl font-semibold">{pad(timeLeft.days)}</p>
                <span className="text-xs opacity-70">Hari</span>
              </div>

              {/* HOURS */}
              <div className="w-14 rounded-lg bg-white/10 p-3 text-center text-white">
                <p className="text-xl font-semibold">{pad(timeLeft.hours)}</p>
                <span className="text-xs opacity-70">Jam</span>
              </div>

              {/* MINUTES */}
              <div className="w-14 rounded-lg bg-white/10 p-3 text-center text-white">
                <p className="text-xl font-semibold">{pad(timeLeft.minutes)}</p>
                <span className="text-xs opacity-70">Menit</span>
              </div>

              {/* SECONDS */}
              <div className="w-14 rounded-lg bg-white/10 p-3 text-center text-white">
                <p className="text-xl font-semibold">{pad(timeLeft.seconds)}</p>
                <span className="text-xs opacity-70">Detik</span>
              </div>
            </div>
          </div>

          <div>
            <MarqueeCards />
          </div>
        </div>
      </div>
    </section>
  );
}
