import { Instagram, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import logo from "public/img/logo.webp";

export default function FooterSection() {
  return (
    <>
      <section className="bg-foreground pt-16 pb-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-3 gap-30">
            <div className="flex flex-col gap-6">
              <div>
                <Image src={logo} alt="" className="w-48" />
              </div>
              <p className="text-sm text-gray-300">
                Roxas Store adalah Platform Resmi Untuk Semua Kebutuhan TopUp &
                Voucher Game. Roxas Store Menyedikan Harga Termurah, Proses
                Cepat, dan Kebutuhan Lainnya Dengan harga Kompetitif.
              </p>
              <div className="flex gap-4">
                <Instagram className="bg-primary h-10 w-10 cursor-pointer rounded-lg px-2 py-2 text-white" />
                <Phone className="bg-primary h-10 w-10 cursor-pointer rounded-lg px-2 py-2 text-white" />
              </div>
            </div>

            <div className="col-span-2">
              <div className="grid grid-cols-4 gap-16">
                <div>
                  <h1 className="text-primary mb-8 font-medium">Peta Situs</h1>
                  <div className="flex flex-col gap-3">
                    <Link
                      href={""}
                      className="font-light text-gray-300 hover:text-white"
                    >
                      Beranda
                    </Link>
                    <Link
                      href={""}
                      className="font-light text-gray-300 hover:text-white"
                    >
                      Masuk
                    </Link>
                    <Link
                      href={""}
                      className="font-light text-gray-300 hover:text-white"
                    >
                      Cek Transaksi
                    </Link>
                    <Link
                      href={""}
                      className="font-light text-gray-300 hover:text-white"
                    >
                      Ulasan Website
                    </Link>
                    <Link
                      href={""}
                      className="font-light text-gray-300 hover:text-white"
                    >
                      Ulasan Google
                    </Link>
                  </div>
                </div>

                <div>
                  <h1 className="text-primary mb-8 font-medium">Kemitraan</h1>
                  <div className="flex flex-col gap-3">
                    <Link
                      href={""}
                      className="font-light text-gray-300 hover:text-white"
                    >
                      Daftar Reseller
                    </Link>
                  </div>
                </div>

                <div>
                  <h1 className="text-primary mb-8 font-medium">Dukungan</h1>
                  <div className="flex flex-col gap-3">
                    <Link
                      href={""}
                      className="font-light text-gray-300 hover:text-white"
                    >
                      WhatsApp
                    </Link>
                    <Link
                      href={""}
                      className="font-light text-gray-300 hover:text-white"
                    >
                      Instagram
                    </Link>
                    <Link
                      href={""}
                      className="font-light text-gray-300 hover:text-white"
                    >
                      Email
                    </Link>
                  </div>
                </div>

                <div>
                  <h1 className="text-primary mb-8 font-medium">Legalistas</h1>
                  <div className="flex flex-col gap-3">
                    <Link
                      href={""}
                      className="font-light text-gray-300 hover:text-white"
                    >
                      Kebijakan Privasi
                    </Link>
                    <Link
                      href={""}
                      className="font-light text-gray-300 hover:text-white"
                    >
                      Syarat dan Ketentuan
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-18 h-px w-full rounded-full bg-gray-500"></div>

          <div className="mt-4 text-sm font-light text-white">
            ©{new Date().getFullYear()} Roxas Store. All rights reserved.
            <h1></h1>
          </div>
        </div>
      </section>
    </>
  );
}
