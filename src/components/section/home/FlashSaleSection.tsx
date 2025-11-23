"use client";

import { useEffect, useState } from "react";
import MarqueeCards from "./MarqueeCards";

export default function FlashSaleSection() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    const getStoredEndTime = () => {
      const saved = localStorage.getItem("flashsale_endtime");
      return saved ? Number(saved) : null;
    };

    const getNextResetTime = () => {
      const now = Date.now();
      return now + ONE_WEEK_MS;
    };

    // ambil dari localStorage
    let storedEnd = getStoredEndTime();

    // jika null → buat baru
    if (storedEnd === null) {
      storedEnd = getNextResetTime();
      localStorage.setItem("flashsale_endtime", String(storedEnd));
    }

    // pastikan endTime *selalu* number
    let endTime: number = storedEnd;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        endTime = getNextResetTime();
        localStorage.setItem("flashsale_endtime", String(endTime));
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Helper for 2 digit numbers
  const pad = (num: number) => String(num).padStart(2, "0");

  return (
    <>
      <section>
        <div className="mx-auto mt-12 max-w-7xl mb-16">
          <div className="bg-card rounded-xl">
            <div className="flex items-center justify-between p-8">
              <div>
                <div className="mb-2 flex gap-2 text-3xl">
                  <span>⚡️</span>
                  <p className="font-medium text-white">FLASH SALE</p>
                </div>
                <p className="text-white">
                  Pesan sekarang! Persediaan terbatas.
                </p>
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
                  <p className="text-xl font-semibold">
                    {pad(timeLeft.minutes)}
                  </p>
                  <span className="text-xs opacity-70">Menit</span>
                </div>

                {/* SECONDS */}
                <div className="w-14 rounded-lg bg-white/10 p-3 text-center text-white">
                  <p className="text-xl font-semibold">
                    {pad(timeLeft.seconds)}
                  </p>
                  <span className="text-xs opacity-70">Detik</span>
                </div>
              </div>
              {/* END COUNTDOWN */}
            </div>

            <div>
              <MarqueeCards />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
