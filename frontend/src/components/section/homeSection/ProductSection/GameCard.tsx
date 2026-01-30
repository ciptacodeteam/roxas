import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";

interface GameCardProps {
  item: {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    slug: string;
  };
}

export default function GameCard({ item }: GameCardProps) {
  const locale = useLocale();

  return (
    <Link href={`/${locale}/product/${item.slug}`}>
      <div className="group relative cursor-pointer overflow-hidden lg:rounded-2xl rounded-lg bg-neutral-800 shadow transition-all hover:outline-2 hover:outline-rose-500">
        <div className="relative aspect-2/3 w-full">
          <Image
            src={item.image || "/img/icon1.webp"}
            alt={item.title}
            fill
            className="object-cover"
          />

          {/* Gradient muncul saat hover */}
          <div className="absolute right-0 bottom-0 left-0 flex h-40 translate-y-10 flex-col justify-end bg-linear-to-t from-black to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
            <p className="text-sm text-white/70">{item.subtitle}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
