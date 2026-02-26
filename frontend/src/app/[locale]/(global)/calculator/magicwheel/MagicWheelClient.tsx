"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export default function MagicWheelPage() {
  const [point, setPoint] = useState(0);

  const diamondNeeded = useMemo(() => {
    const maxPoint = 200;
    const diamondPerSpin = 5;
    return Math.max((maxPoint - point) * diamondPerSpin, 0);
  }, [point]);

  return (
    <section className="mt-42 mb-14 flex mx-auto max-w-4xl">
      <div className="items-center justify-center w-full">
        <Card className="border-0">
          <CardContent className="space-y-10 p-10">
            {/* Header */}
            <div className="space-y-3 text-center">
              <h1 className="text-3xl font-bold text-white">
                Kalkulator Magic Wheel
              </h1>
              <p className="mx-auto max-w-2xl text-slate-400">
                Digunakan untuk mengetahui total estimasi diamond yang
                dibutuhkan untuk mendapatkan skin Legends.
              </p>
            </div>

            {/* Slider */}
            <div className="space-y-4">
              <p className="text-center text-slate-300">
                Geser sesuai dengan Titik Magic Wheel Kamu
              </p>

              <Slider
                value={[point]}
                onValueChange={(val) =>
                  val[0] !== undefined && setPoint(val[0])
                }
                min={0}
                max={200}
                step={1}
                className="w-full"
              />
            </div>

            {/* Result */}
            <div className="grid gap-6 text-center md:grid-cols-2">
              <div className="text-lg font-semibold text-white">
                Poin Bintang Kamu{" "}
                <span className="text-primary text-xl">{point}</span>
              </div>

              <div className="text-lg font-semibold text-white">
                Membutuhkan Maksimal{" "}
                <span className="text-primary text-xl">{diamondNeeded}</span>{" "}
                Diamond
              </div>
            </div>

            {/* CTA */}
            <Button className="bg-primary hover:bg-primary/90 w-full cursor-pointer rounded-full py-6 text-lg font-semibold text-white">
              Top Up Diamond Sekarang!
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
