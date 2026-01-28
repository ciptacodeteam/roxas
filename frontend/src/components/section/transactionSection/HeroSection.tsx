import animation3 from "public/gif/animation3.gif";
import Image from "next/image";

export default function HeroTransaction() {
  return (
    <>
      <section className="relative">
        <div className="mx-auto mt-42 max-w-7xl mb-10">
          <div className="bg-card relative overflow-visible rounded-2xl bg-[url(/img/bgroxas.webp)] bg-cover bg-center bg-no-repeat px-10 py-16">
            {/* OVERLAY GELAP */}
            <div className="absolute inset-0 rounded-2xl bg-black/70"></div>

            {/* TEXT SECTION */}
            <div className="relative z-10 max-w-3xl">
              <h2 className="text-3xl font-semibold text-white">
                Cek Invoice Kamu dengan Mudah dan Cepat
              </h2>
              <p className="mt-4 leading-normal text-white/70">
                Transaksimu akan otomatis diproses, umumnya akan selesai dalam
                1-2 detik namun jika kamu mengalami masalah silahkan cari
                transaksimu disini.
              </p>
            </div>

            {/* CHARACTER FIXED DI BAWAH CARD */}
            <Image
              src={animation3}
              alt="Character"
              className="pointer-events-none absolute right-20 bottom-0 w-[300px]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
