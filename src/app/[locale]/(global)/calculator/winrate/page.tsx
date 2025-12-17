"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import Image from "next/image";

import bgCharacter from "public/img/background.webp";
import valir from "public/gif/valir.gif";

export default function WinRatePage() {
  const [totalMatch, setTotalMatch] = useState<number | "">("");
  const [currentWR, setCurrentWR] = useState<number | "">("");
  const [targetWR, setTargetWR] = useState<number | "">("");

  const result = useMemo(() => {
    if (
      totalMatch === "" ||
      currentWR === "" ||
      targetWR === "" ||
      targetWR <= currentWR
    ) {
      return null;
    }

    const currentWin = totalMatch * (currentWR / 100);
    const target = targetWR / 100;

    const neededWin = Math.ceil(
      (target * totalMatch - currentWin) / (1 - target),
    );

    return neededWin > 0 ? neededWin : 0;
  }, [totalMatch, currentWR, targetWR]);

  return (
    <>
      <section>
        <div className="mt-42 mb-14">
          <div className="mx-auto max-w-7xl">
            <div className="flex gap-6">
              <Card className="w-full border-0 p-10">
                <div className="space-y-6 bg-transparent">
                  {/* Header */}
                  <div className="mb-8 space-y-2">
                    <h1 className="text-3xl font-bold text-white">
                      Kalkulator Win Rate
                    </h1>
                    <p className="text-sm text-slate-400">
                      Digunakan untuk menghitung total pertandingan yang
                      dibutuhkan untuk mencapai win rate yang diinginkan.
                    </p>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-300">
                        Total Pertandingan Kamu Saat Ini
                      </label>
                      <Input
                        placeholder="Contoh: 223"
                        type="number"
                        value={totalMatch}
                        onChange={(e) =>
                          setTotalMatch(e.target.valueAsNumber || "")
                        }
                        className="mt-1 [appearance:textfield] border-slate-700 bg-slate-800 text-white placeholder:text-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-300">
                        Total Win Rate Kamu Saat Ini (%)
                      </label>
                      <Input
                        placeholder="Contoh: 54"
                        type="number"
                        value={currentWR}
                        onChange={(e) =>
                          setCurrentWR(e.target.valueAsNumber || "")
                        }
                        className="mt-1 [appearance:textfield] border-slate-700 bg-slate-800 text-white placeholder:text-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-300">
                        Win Rate Total yang Kamu Inginkan (%)
                      </label>
                      <Input
                        placeholder="Contoh: 70"
                        type="number"
                        value={targetWR}
                        onChange={(e) =>
                          setTargetWR(e.target.valueAsNumber || "")
                        }
                        className="mt-1 [appearance:textfield] border-slate-700 bg-slate-800 text-white placeholder:text-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  {/* Actions (tetap ada, tapi logic auto jalan) */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary flex-1 cursor-pointer bg-transparent hover:text-white"
                    >
                      Pesan Joki
                    </Button>
                  </div>

                  {/* Result */}
                  {result !== null && (
                    <div className="border-primary/40 bg-primary/10 mt-6 rounded-lg border px-6 py-4 text-center">
                      <p className="text-primary text-sm font-semibold">
                        YOU NEED ABOUT <span className="text-xl">{result}</span>{" "}
                        WIN WITHOUT LOSE TO GET A{" "}
                        <span className="text-xl">{targetWR}%</span> WIN RATE
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
