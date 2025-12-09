import characterImg from "public/img/character3.webp";
import Image from "next/image";

export default function HeroLeaderboard() {
  return (
    <>
      <section className="relative">
        <div className="mx-auto mt-42 mb-10 max-w-7xl">
          <div className="bg-card relative overflow-visible rounded-2xl bg-[url(/img/bgroxas.webp)] bg-cover bg-center bg-no-repeat px-10 py-16">
            {/* OVERLAY GELAP */}
            <div className="absolute inset-0 rounded-2xl bg-black/70"></div>

            {/* TEXT SECTION */}
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-3xl font-semibold text-white">
                Top 10 Pembelian Terbanyak di ROXAS STORE
              </h2>
              <p className="mt-4 leading-normal text-white/70">
                Berikut ini adalah daftar 10 pembelian terbanyak yang dilakukan
                oleh pelanggan kami. Data ini diambil dari sistem kami dan
                selalu diperbaharui.
              </p>
            </div>

            {/* CHARACTER FIXED DI BAWAH CARD */}
            <Image
              src={characterImg}
              alt="Character"
              className="pointer-events-none absolute right-0 bottom-0 w-[380px]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
