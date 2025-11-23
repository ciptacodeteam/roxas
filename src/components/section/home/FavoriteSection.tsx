import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function FavoriteSection() {
  const games = [
    {
      id: 1,
      name: "Mobile Legends",
      corp: "Moonton",
      image: "/img/icon1.webp",
    },
    { id: 2, name: "PUBG Mobile", corp: "Tencent", image: "/img/icon1.webp" },
    {
      id: 3,
      name: "Genshin Impact",
      corp: "Hoyoverse",
      image: "/img/icon1.webp",
    },
    { id: 4, name: "Free Fire", corp: "Garena", image: "/img/icon1.webp" },
    {
      id: 5,
      name: "Honor of Kings",
      corp: "Tencent",
      image: "/img/icon1.webp",
    },
    { id: 6, name: "Magic Chess", corp: "Moonton", image: "/img/icon1.webp" },
  ];

  return (
    <section>
      <div className="mx-auto mb-12 max-w-7xl">
        <div>
          <div className="mb-2 flex gap-2 text-3xl">
            <span>🔥</span>
            <p className="font-medium text-white">POPULER SEKARANG !</p>
          </div>
          <p className="text-white">Silahkan Temukan Game Kamu.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Card
              key={game.id}
              className="hover:border-primary relative cursor-pointer overflow-hidden rounded-xl border-background bg-[url(/img/bgroxas.webp)] bg-cover bg-center transition-all py-1"
            >
              {/* overlay hitam */}
              <div className="absolute inset-0 bg-rose-950/60"></div>

              <CardContent className="relative z-10 flex items-center gap-4 p-4">
                <Image
                  src={game.image}
                  alt={game.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-lg object-cover"
                />

                <div className="flex flex-col justify-center">
                  <p className="text-xl font-semibold text-white">
                    {game.name}
                  </p>
                  <p className="text-sm text-white/70">{game.corp}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
