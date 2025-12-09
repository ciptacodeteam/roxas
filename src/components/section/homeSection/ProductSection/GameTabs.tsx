/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import Link from "next/link";

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export default function GameTabs({ categories, active, setActive }: any) {
  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex gap-3 overflow-x-auto pb-4">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`cursor-pointer rounded-full px-5 py-2 transition ${
                active === cat
                  ? "bg-primary text-white"
                  : "bg-card hover:bg-muted-foreground transition-300 text-white"
              } `}
            >
              {cat}
            </button>
          ))}
        </div>

        <div>
          <Link href={""} className="text-white hover:text-gray-200">Selengkapnya</Link>
        </div>
      </div>
    </>
  );
}
