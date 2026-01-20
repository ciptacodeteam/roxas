import { CircleStar, ShieldCheck, Wallet } from "lucide-react";
import Image from "next/image";
import characterImg from "public/img/character1.webp"; // ganti sesuai gambarmu

export default function InformationSection() {
  return (
    <section className="relative">
      <div className="mx-auto lg:max-w-7xl w-11/12 lg:mb-16 mb-10">
        <div className="bg-card relative overflow-visible rounded-2xl lg:px-10 lg:py-16 px-5 py-6">
          {/* TEXT SECTION */}
          <div className="relative z-10 max-w-3xl">
            <h2 className="lg:text-3xl text-2xl font-semibold text-white">
              Top Up Game Teraman
            </h2>
            <p className="mt-4 lg:text-base text-sm leading-normal text-white/70">
              Nikmati Top Up Game Online Otomatis dengan harga termurah dan
              pilihan metode pembayaran terlengkap. Kunjungi website kami yang
              selalu buka 24/7 untuk memenuhi kebutuhan gaming Anda kapan saja,
              di mana saja. Transaksi aman, cepat, dan terjangkau hanya dengan
              satu klik!
            </p>
          </div>

          {/* CHARACTER IMAGE KELUAR DARI CARD */}
          <Image
            src={characterImg}
            alt="Character"
            className="pointer-events-none absolute -top-14 -right-4 w-[420px] drop-shadow-2xl lg:block hidden"
          />

          <div className="lg:mt-10 mt-6">
            <div className="relative z-20 grid lg:grid-cols-3 gap-4">
              <div className="bg-muted-foreground rounded-lg p-5">
                <div className="flex items-center gap-6">
                  <div>
                    <Wallet size={32} className="text-primary" />
                  </div>
                  <div className="text-white">
                    <h1 className="text-primary mb-2 text-xl font-medium">
                      Harga Terbaik
                    </h1>
                    <p className="text-muted text-sm">
                      Banyak pilihan game dengan harga terbaik dan promo menarik
                      untukmu!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted-foreground rounded-lg p-5">
                <div className="flex items-center gap-6">
                  <div>
                    <ShieldCheck size={32} className="text-primary" />
                  </div>
                  <div className="text-white">
                    <h1 className="text-primary mb-2 text-xl font-medium">
                      Transaksi Aman
                    </h1>
                    <p className="text-muted text-sm">
                      Proteksi ekstra untuk keamanan data pribadi dan data
                      pembayaranmu!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted-foreground rounded-lg p-5">
                <div className="flex items-center gap-6">
                  <div>
                    <CircleStar size={32} className="text-primary" />
                  </div>
                  <div className="text-white">
                    <h1 className="text-primary mb-2 text-xl font-medium">
                      Pengiriman Cepat
                    </h1>
                    <p className="text-muted text-sm">
                      Setelah pembayaranmu selesai, kami akan kirim dalam hitungan detik!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
