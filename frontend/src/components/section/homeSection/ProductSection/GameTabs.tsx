/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import Link from "next/link";

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export default function GameTabs({ categories, active, setActive }: any) {
  return (
    <>
      <div>
        <div className="mt-8 flex items-center justify-between lg:mt-10">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {categories.map((cat: string) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`cursor-pointer rounded-full px-5 py-2 whitespace-nowrap transition ${
                  active === cat
                    ? "bg-primary text-white"
                    : "bg-card hover:bg-muted-foreground transition-300 text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* <div>
            <Link
              href={""}
              className="hidden text-white hover:text-gray-200 lg:block"
            >
              Selengkapnya
            </Link>
          </div> */}
        </div>
      </div>
    </>
  );
}
