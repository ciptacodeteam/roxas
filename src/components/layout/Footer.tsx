import { Instagram, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logo from "public/img/logo1.webp";

export default function FooterSection() {
  return (
    <section className="bg-foreground lg:pt-16 pt-12 pb-10">
      <div className="mx-auto lg:max-w-7xl w-11/12">
        {/* TOP */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-30">
          {/* BRAND */}
          <div className="flex flex-col gap-6 lg:items-start lg:text-left">
            <Image src={logo} alt="" className="w-52 lg:w-48" />

            <p className="text-sm text-white">
              Roxas Store adalah Platform Resmi Untuk Semua Kebutuhan TopUp &
              Voucher Game. Roxas Store Menyedikan Harga Termurah, Proses Cepat,
              dan Kebutuhan Lainnya Dengan harga Kompetitif.
            </p>

            <div className="flex gap-4">
              <Instagram className="bg-primary h-10 w-10 cursor-pointer rounded-lg p-2 text-white" />
              <Phone className="bg-primary h-10 w-10 cursor-pointer rounded-lg p-2 text-white" />
            </div>
          </div>

          {/* LINKS */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-16">
              <div>
                <h1 className="text-primary mb-4 font-medium md:mb-8">
                  Peta Situs
                </h1>
                <div className="flex flex-col gap-3">
                  <Link
                    href=""
                    className="text-sm font-light text-gray-300 hover:text-white"
                  >
                    Beranda
                  </Link>
                  <Link
                    href=""
                    className="text-sm font-light text-gray-300 hover:text-white"
                  >
                    Masuk
                  </Link>
                  <Link
                    href=""
                    className="text-sm font-light text-gray-300 hover:text-white"
                  >
                    Cek Transaksi
                  </Link>
                  <Link
                    href=""
                    className="text-sm font-light text-gray-300 hover:text-white"
                  >
                    Ulasan Website
                  </Link>
                  <Link
                    href=""
                    className="text-sm font-light text-gray-300 hover:text-white"
                  >
                    Ulasan Google
                  </Link>
                </div>
              </div>

              <div>
                <h1 className="text-primary mb-4 font-medium md:mb-8">
                  Kemitraan
                </h1>
                <Link
                  href=""
                  className="text-sm font-light text-gray-300 hover:text-white"
                >
                  Daftar Reseller
                </Link>
              </div>

              <div>
                <h1 className="text-primary mb-4 font-medium md:mb-8">
                  Dukungan
                </h1>
                <div className="flex flex-col gap-3">
                  <Link
                    href=""
                    className="text-sm font-light text-gray-300 hover:text-white"
                  >
                    WhatsApp
                  </Link>
                  <Link
                    href=""
                    className="text-sm font-light text-gray-300 hover:text-white"
                  >
                    Instagram
                  </Link>
                  <Link
                    href=""
                    className="text-sm font-light text-gray-300 hover:text-white"
                  >
                    Email
                  </Link>
                </div>
              </div>

              <div>
                <h1 className="text-primary mb-4 font-medium md:mb-8">
                  Legalistas
                </h1>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/privacypolicy"
                    className="text-sm font-light text-gray-300 hover:text-white"
                  >
                    Kebijakan Privasi
                  </Link>
                  <Link
                    href="/termsconditions"
                    className="text-sm font-light text-gray-300 hover:text-white"
                  >
                    Syarat dan Ketentuan
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="lg:mb-8 my-6 h-px w-full rounded-full bg-gray-500 mt-28 lg:mt-20" />

        {/* COPYRIGHT */}
        <div className="text-center text-sm font-light text-white lg:text-left">
          ©{new Date().getFullYear()} Roxas Store. All rights reserved.
        </div>
      </div>
    </section>
  );
}
