export default function HeroLeaderboard() {
  return (
    <>
      <section className="relative lg:block hidden">
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
          </div>
        </div>
      </section>
    </>
  );
}
