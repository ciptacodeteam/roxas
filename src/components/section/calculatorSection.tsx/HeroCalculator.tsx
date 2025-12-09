import characterImg from "public/img/character5.webp";
import Image from "next/image";

export default function HeroCalculator() {
  return (
    <>
      <section className="relative">
        <div className="mx-auto mt-42 mb-10 max-w-7xl">
          <div className="bg-card relative overflow-visible rounded-2xl bg-[url(/img/bgroxas.webp)] bg-cover bg-center bg-no-repeat px-10 py-16">
            {/* OVERLAY GELAP */}
            <div className="absolute inset-0 rounded-2xl bg-black/70"></div>

            {/* TEXT SECTION */}
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-5xl font-semibold text-white">
                Kalkulator Win Rate
              </h2>
              <p className="mt-4 w-4/5 leading-normal text-white/70">
                Digunakan untuk menghitung total jumlah pertandingan yang harus
                diambil untuk mencapai target tingkat kemenangan yang
                diinginkan.
              </p>
            </div>

            {/* CHARACTER FIXED DI BAWAH CARD */}
            <Image
              src={characterImg}
              alt="Character"
              className="pointer-events-none absolute -right-5 -bottom-5 w-[480px]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
