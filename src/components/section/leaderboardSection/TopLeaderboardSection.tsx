// app/leaderboard/page.tsx
"use client";

import { leaderboard } from "@/lib/data/leaderboard";

function formatRupiah(n: number) {
  return n.toLocaleString("id-ID");
}

export default function TopLeaderboardPage() {
  return (
    <main className="mx-auto mt-8 max-w-7xl pb-14">
      <div className="grid gap-6 md:grid-cols-3">
        {leaderboard.map((group, idx) => (
          <section
            key={idx}
            aria-labelledby={`leaderboard-${idx}`}
            className="relative overflow-hidden rounded-xl border border-gray-800/60 bg-linear-to-b from-card to-card/20 p-6 backdrop-blur-sm"
          >
            <h2
              id={`leaderboard-${idx}`}
              className="mb-6 bg-linear-to-r from-white to-gray-400 bg-clip-text text-center text-xl font-semibold tracking-wide text-transparent"
            >
              {group.title}
            </h2>

            <ol className="space-y-3">
              {group.items.map((item, index) => {
                const isTop3 = index < 3;
                return (
                  <li
                    key={item.name + index}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${
                      isTop3
                        ? "border-yellow-500/30 bg-linear-to-r from-white/5 to-yellow-200/10"
                        : "border-gray-800/50 bg-black/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium">
                        {isTop3 ? (
                          <span className="text-lg">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-medium text-white">
                          {item.name}
                        </div>
                        <div className="text-xs text-gray-400">Transaksi</div>
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-gray-200">
                      Rp {formatRupiah(item.amount)}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </main>
  );
}
