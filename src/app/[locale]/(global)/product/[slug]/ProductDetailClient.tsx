/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

/* eslint-disable react-hooks/rules-of-hooks */
import { productDetail } from "@/lib/data/productDetail";
import Image from "next/image";
import { useState } from "react";

import wdp from "public/img/wdp.webp";
import lightning from "public/gif/lightning.gif";
import cs from "public/gif/contact-support.gif";
import secure from "public/gif/secure.gif";
import qris from "public/svg/QRIS_Logo.svg";
import indomaret from "public/svg/indomaret.svg";
import alfamart from "public/svg/alfamart.svg";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ChevronDown, CircleAlert, TicketPercent } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CountryPhoneInput from "@/components/section/register/CountryPhoneInput";

type ProductData = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string;
  bannerImage: string | null;
  canvas: string;
  inputFields: Array<{
    name: string;
    label: string;
    required: boolean;
    dialog?: {
      title: string;
      content: string;
    };
  }>;
  items: Array<{
    id: string;
    name: string;
    price: number;
    basePrice: number;
    skuCode: string;
  }>;
};

export default function ProductDetailClient({
  slug,
  productData,
}: {
  slug: string;
  productData: ProductData | null;
}) {
  // Use database data if available, otherwise fall back to hardcoded data
  const hardcodedProduct = productDetail[slug as keyof typeof productDetail];
  const product = productData || hardcodedProduct;

  const [phone, setPhone] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | null>(
    productData?.items?.[0]?.id || null
  );

  if (!product) {
    return <div className="mt-96 text-white">Produk tidak ditemukan</div>;
  }

  // Get items - use database items if available, otherwise use hardcoded denominations
  // Sort items by price (ascending)
  const items = (
    productData?.items || (product as any).denominations || []
  ).sort((a: any, b: any) => {
    const priceA = a.price || a.sellPrice || 0;
    const priceB = b.price || b.sellPrice || 0;
    return priceA - priceB;
  });

  return (
    <section className="mt-30">
      {/* Banner */}
      <div className="relative aspect-16/4 w-full overflow-hidden">
        <Image
          src={product.canvas}
          alt="Banner"
          fill
          priority
          className="object-cover"
        />
      </div>

      <div className="relative z-10 bg-[url(/img/bgroxas.webp)] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 -z-30 bg-black/75"></div>

        <div className="container mx-auto flex max-w-7xl items-start gap-6 px-4">
          {/* Card Game */}
          <div className="-mt-40 w-52 shrink-0 pb-10">
            <div className="aspect-2/3 overflow-hidden rounded-xl">
              <Image
                src={product.image}
                alt={productData?.name || (product as any).title || "Product"}
                width={300}
                height={420}
                className="object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="pt-6 text-white">
            <h1 className="text-2xl font-bold uppercase">
              {productData?.name || (product as any).title}
            </h1>

            <div className="flex gap-6 text-sm text-gray-300">
              <div className="flex items-center gap-1">
                <Image alt="" src={lightning} className="w-6" /> Proses Cepat
              </div>
              <div className="flex items-center gap-1">
                <Image alt="" src={cs} className="w-8" /> Layanan Chat 24/7
              </div>
              <div className="flex items-center gap-1">
                <Image alt="" src={secure} className="w-5" /> Pembayaran Aman
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto my-12 max-w-7xl">
        <div className="w-2/3">
          {/* Form Input */}
          <div className="flex flex-col gap-8">
            <div className="overflow-hidden rounded-2xl bg-gray-800">
              {/* Header */}
              <div className="flex items-center gap-4 bg-black/40">
                <div className="bg-primary flex h-10 w-10 items-center justify-center font-semibold text-white">
                  1
                </div>
                <h2 className="font-medium text-white">Masukkan Data Akun</h2>
              </div>
              {/* Form */}
              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                {/* ID */}
                {product.inputFields.map((field) => (
                  <div key={field.name}>
                    <Label className="mb-2 flex items-center gap-2 text-sm text-white">
                      {field.label}
                      {field.name === "userId" && field.dialog && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              type="button"
                              className="cursor-pointer text-xs text-gray-400"
                            >
                              ⓘ
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>{field.dialog.title}</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-gray-600">
                              {field.dialog.content}
                            </p>
                          </DialogContent>
                        </Dialog>
                      )}
                    </Label>
                    <Input
                      placeholder={field.label}
                      type="number"
                      className="bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Validasi Akun */}
            <div className="overflow-hidden rounded-2xl bg-gray-800">
              <div className="flex items-center gap-4 bg-black/40">
                <div className="bg-primary flex h-10 w-10 items-center justify-center font-semibold text-white">
                  2
                </div>
                <h2 className="font-medium text-white">Validasi Akun</h2>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-300">
                  Pastikan User ID dan Server ID yang Anda masukkan sudah benar.
                  Kami akan memvalidasi akun Anda sebelum melanjutkan ke pembayaran.
                </p>
              </div>
            </div>

            {/* Step 3: Pilih Nominal */}
            <div className="overflow-hidden rounded-2xl bg-gray-800">
              {/* Header */}
              <div className="flex items-center gap-4 bg-black/40">
                <div className="bg-primary flex h-10 w-10 items-center justify-center font-semibold text-white">
                  3
                </div>
                <h2 className="font-medium text-white">Pilih Nominal</h2>
              </div>
              {/* Form */}
              <div className="gap-6 p-4 md:grid-cols-2">
                {items.length > 0 && (
                  <>
                    <div>
                      <h1 className="mb-4 text-sm text-white">
                        ✨ Pilih Nominal
                      </h1>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {items.map((item: any) => {
                        const itemPrice = item.price || item.sellPrice || 0;
                        const itemBasePrice = item.basePrice || item.oldPrice || 0;
                        const discount =
                          itemBasePrice > itemPrice
                            ? Math.round(
                                ((itemBasePrice - itemPrice) / itemBasePrice) *
                                  100
                              )
                            : 0;
                        const isSelected = selectedItem === item.id;

                        return (
                          <Card
                            key={item.id}
                            onClick={() => setSelectedItem(item.id)}
                            className={cn(
                              "group cursor-pointer overflow-hidden border-0 bg-[#313C4C] bg-[url(/img/background.png)] bg-cover bg-no-repeat px-0 py-0 pt-4 transition-all hover:outline-2 hover:outline-rose-500",
                              isSelected && "outline-2 outline-rose-500"
                            )}
                          >
                            <CardHeader className="-mb-5">
                              <CardTitle className="text-sm text-white">
                                {item.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="-mb-2 flex items-center gap-4">
                              <Image
                                src={wdp}
                                alt={item.name}
                                className="w-12 transition-transform duration-300 group-hover:rotate-10"
                              />
                              <div>
                                <h1 className="text-base font-semibold text-yellow-500">
                                  Rp {itemPrice.toLocaleString("id-ID")}
                                </h1>
                                {itemBasePrice > itemPrice && (
                                  <p className="text-primary text-xs line-through">
                                    Rp {itemBasePrice.toLocaleString("id-ID")}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                            <CardFooter className="from-card to-card/40 flex justify-end bg-linear-to-t p-3 px-3">
                              {discount > 0 && (
                                <div className="flex gap-3">
                                  <div className="flex items-center rounded-sm bg-white p-1 px-2">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="42"
                                      height="16"
                                      fill="none"
                                      viewBox="0 0 52 16"
                                    >
                                      <path
                                        fill="#285346"
                                        fillRule="evenodd"
                                        d="M8.57 14.744a.5.5 0 0 0 .437.256.5.5 0 0 0 .395-.22l6.5-8.5a.5.5 0 0 0 .055-.5.5.5 0 0 0-.45-.28h-2.375l.865-3.89a.5.5 0 0 0-.49-.61h-5a.5.5 0 0 0-.5.385L7.635 3H0v1.333h7.327l-.462 2H1.333v1.334h5.225l-.05.218a.5.5 0 0 0 .5.615h2.414l-.179 1.167H6V11h3.038l-.526 3.425a.5.5 0 0 0 .058.319M3.333 9.667h2V11h-2z"
                                        clipRule="evenodd"
                                      />
                                      <path
                                        fill="#285346"
                                        d="M20.582 5.042q-.15 0-.222-.096-.066-.096-.048-.264l.576-3.606q.024-.156.114-.228a.35.35 0 0 1 .24-.078h1.272q.672 0 1.032.294t.36.864q0 .66-.414 1.044t-1.206.384H21.14l-.216 1.38a.4.4 0 0 1-.108.234.35.35 0 0 1-.234.072m.642-2.184h1.098q.48 0 .726-.228.252-.228.252-.66 0-.36-.216-.528-.21-.174-.636-.174h-.972zm4.225 2.196q-.432 0-.75-.156a1.2 1.2 0 0 1-.486-.456 1.4 1.4 0 0 1-.168-.696q0-.48.198-.87t.552-.624q.36-.234.834-.234.354 0 .594.126.24.12.378.33t.18.474q.048.264.018.54-.012.114-.06.15a.23.23 0 0 1-.138.036h-2.076l.048-.372h1.842l-.108.084a1.1 1.1 0 0 0-.018-.474.6.6 0 0 0-.216-.336q-.162-.132-.45-.132a.87.87 0 0 0-.498.138.95.95 0 0 0-.312.342q-.108.21-.15.444l-.024.162q-.084.48.144.768.234.288.708.288.198 0 .396-.048a1.2 1.2 0 0 0 .366-.156.3.3 0 0 1 .168-.048q.078 0 .12.048a.2.2 0 0 1 .06.12.24.24 0 0 1-.024.144.3.3 0 0 1-.114.126 1.5 1.5 0 0 1-.486.216 2.3 2.3 0 0 1-.528.066m2.155-.012q-.138 0-.204-.096t-.042-.264l.372-2.352a.34.34 0 0 1 .114-.222.34.34 0 0 1 .234-.078q.132 0 .198.084t.036.252l-.066.444-.036-.102q.15-.336.432-.51.288-.18.678-.18.324 0 .54.132a.7.7 0 0 1 .312.402q.096.27.03.684l-.234 1.506a.34.34 0 0 1-.108.228.37.37 0 0 1-.24.072q-.144 0-.21-.096t-.042-.258l.228-1.44q.06-.378-.06-.558-.12-.186-.432-.186-.402 0-.642.246-.234.246-.3.672l-.21 1.32q-.042.3-.348.3m4.567 1.092q-.354 0-.666-.09a2 2 0 0 1-.552-.234.25.25 0 0 1-.114-.12.25.25 0 0 1-.006-.144.3.3 0 0 1 .066-.126.25.25 0 0 1 .126-.06.25.25 0 0 1 .168.042q.198.12.42.192t.474.072q.378 0 .606-.18.234-.18.3-.57l.102-.63.048.006q-.144.3-.426.468a1.23 1.23 0 0 1-.642.168 1.3 1.3 0 0 1-.618-.144 1.04 1.04 0 0 1-.408-.414 1.35 1.35 0 0 1-.144-.642q0-.336.102-.642a1.7 1.7 0 0 1 .294-.552q.192-.24.462-.378.276-.138.624-.138.354 0 .624.174.27.168.372.51l-.066.12.078-.498a.35.35 0 0 1 .108-.222.36.36 0 0 1 .234-.072q.144 0 .204.096.06.09.036.258l-.396 2.502q-.096.618-.45.93-.348.318-.96.318m.078-1.68a.83.83 0 0 0 .528-.168 1 1 0 0 0 .324-.444q.114-.282.114-.6 0-.354-.192-.552t-.546-.198a.83.83 0 0 0-.522.168q-.216.168-.33.444a1.6 1.6 0 0 0-.108.594q0 .36.192.558t.54.198m2.548.588q-.138 0-.204-.09-.066-.096-.042-.264l.378-2.358a.35.35 0 0 1 .108-.222.35.35 0 0 1 .24-.078q.138 0 .204.096.066.09.042.258l-.378 2.358a.4.4 0 0 1-.108.228.36.36 0 0 1-.24.072m.582-3.624q-.168 0-.252-.084t-.072-.234a.37.37 0 0 1 .132-.27.45.45 0 0 1 .3-.096q.174 0 .258.084t.072.234a.4.4 0 0 1-.132.276.47.47 0 0 1-.306.09m.973 3.624q-.144 0-.21-.09T36.1 4.7l.378-2.376a.35.35 0 0 1 .108-.222.36.36 0 0 1 .234-.072q.138 0 .204.09.066.084.042.252L37 2.774h-.06q.12-.354.408-.546.288-.198.66-.216.15-.006.198.042.054.048.054.168 0 .156-.072.228t-.234.09l-.144.018q-.444.042-.636.264t-.258.606l-.21 1.326a.31.31 0 0 1-.108.216.4.4 0 0 1-.246.072m2.322 0q-.138 0-.204-.09-.066-.096-.042-.264l.378-2.358a.35.35 0 0 1 .108-.222.35.35 0 0 1 .24-.078q.138 0 .204.096.066.09.042.258l-.378 2.358a.4.4 0 0 1-.108.228.36.36 0 0 1-.24.072m.582-3.624q-.168 0-.252-.084t-.072-.234a.37.37 0 0 1 .132-.27.45.45 0 0 1 .3-.096q.174 0 .258.084t.072.234a.4.4 0 0 1-.132.276.47.47 0 0 1-.306.09m.98 3.624q-.139 0-.205-.09T39.99 4.7l.378-2.376a.35.35 0 0 1 .108-.222.35.35 0 0 1 .228-.072q.138 0 .204.09t.042.252l-.072.456-.048-.108q.168-.354.438-.528.276-.174.6-.174.342 0 .558.186.222.18.282.534l-.078-.024q.15-.336.426-.516a1.2 1.2 0 0 1 .66-.18q.306 0 .516.132a.7.7 0 0 1 .3.402q.084.27.018.69l-.24 1.512a.34.34 0 0 1-.102.216.35.35 0 0 1-.234.072q-.15 0-.216-.09t-.042-.252l.228-1.476q.054-.36-.054-.54t-.39-.18a.71.71 0 0 0-.552.246q-.216.24-.288.672l-.204 1.332a.36.36 0 0 1-.114.216.36.36 0 0 1-.234.072q-.144 0-.216-.09-.066-.09-.042-.252l.24-1.476q.054-.36-.06-.54-.108-.18-.384-.18a.72.72 0 0 0-.558.246q-.216.24-.288.672l-.21 1.332q-.042.288-.354.288m5.965.012q-.258 0-.48-.114a1 1 0 0 1-.354-.318.8.8 0 0 1-.132-.456q0-.312.168-.504.174-.192.54-.282a3.8 3.8 0 0 1 .942-.096h.48l-.054.372h-.372a4 4 0 0 0-.66.042q-.24.042-.342.15a.38.38 0 0 0-.102.282q0 .24.156.366a.6.6 0 0 0 .384.126.81.81 0 0 0 .672-.348.9.9 0 0 0 .162-.414l.114-.72q.054-.318-.09-.486-.138-.168-.498-.168-.21 0-.408.042a1.6 1.6 0 0 0-.39.144.27.27 0 0 1-.168.036.25.25 0 0 1-.126-.066.2.2 0 0 1-.054-.126.24.24 0 0 1 .036-.144.4.4 0 0 1 .156-.126q.24-.12.51-.174t.516-.054q.438 0 .69.162a.8.8 0 0 1 .348.45 1.4 1.4 0 0 1 .036.666l-.228 1.446a.34.34 0 0 1-.108.228.33.33 0 0 1-.222.072q-.132 0-.198-.084-.066-.09-.042-.252l.066-.438.048.09a1 1 0 0 1-.594.624 1.1 1.1 0 0 1-.402.072m2.628-.012q-.138 0-.204-.096t-.042-.264l.372-2.352a.34.34 0 0 1 .114-.222.34.34 0 0 1 .234-.078q.132 0 .198.084t.036.252l-.066.444-.036-.102q.15-.336.432-.51.288-.18.678-.18.324 0 .54.132a.7.7 0 0 1 .312.402q.096.27.03.684l-.234 1.506a.34.34 0 0 1-.108.228.37.37 0 0 1-.24.072q-.144 0-.21-.096t-.042-.258l.228-1.44q.06-.378-.06-.558-.12-.186-.432-.186-.402 0-.642.246-.234.246-.3.672l-.21 1.32q-.042.3-.348.3M20.896 15.072q-.32 0-.456-.192-.135-.2-.08-.544l.704-4.424q.048-.312.224-.464.176-.16.48-.16.312 0 .44.192.135.193.08.544l-.704 4.416q-.048.312-.216.472t-.472.16m2.335 0q-.272 0-.416-.176-.135-.184-.088-.512l.728-4.568q.048-.264.192-.392a.54.54 0 0 1 .376-.136q.24 0 .36.096.127.088.256.296l2.2 3.68h-.216l.552-3.496q.048-.296.208-.432.168-.144.456-.144.272 0 .392.184.128.176.08.496l-.72 4.568q-.04.264-.176.4a.49.49 0 0 1-.36.136.7.7 0 0 1-.384-.096 1 1 0 0 1-.272-.304L24.199 11h.216l-.552 3.496q-.04.288-.192.432t-.44.144m7.576.016a4.5 4.5 0 0 1-1.304-.192 4 4 0 0 1-.584-.248.6.6 0 0 1-.256-.256.6.6 0 0 1-.04-.32.54.54 0 0 1 .128-.28.44.44 0 0 1 .264-.16q.16-.04.368.064.368.192.768.28.408.08.768.08.512 0 .792-.184.288-.184.288-.472a.5.5 0 0 0-.168-.384q-.168-.152-.56-.24l-.904-.216q-.593-.136-.944-.504-.344-.368-.344-.952 0-.432.176-.768.183-.344.504-.576.327-.24.744-.36.423-.128.888-.128.399 0 .864.104.471.104.872.344a.537.537 0 0 1 .264.552.45.45 0 0 1-.12.264.45.45 0 0 1-.272.144q-.168.024-.408-.088a2.4 2.4 0 0 0-.592-.208 2.6 2.6 0 0 0-.624-.08q-.32 0-.568.088a.9.9 0 0 0-.376.24.54.54 0 0 0-.128.36q0 .24.152.384.16.136.472.216l.896.216q.687.16 1.04.536.36.375.36.904 0 .465-.192.808t-.536.576a2.6 2.6 0 0 1-.776.344 3.6 3.6 0 0 1-.912.112m4.823-.016q-.303 0-.448-.192-.135-.2-.08-.536l.624-3.96h-1.312q-.255 0-.4-.112a.37.37 0 0 1-.144-.304q0-.288.16-.448.168-.16.456-.16h3.96q.264 0 .4.112.144.104.144.296 0 .288-.16.456-.16.16-.448.16h-1.408l-.648 4.064q-.047.304-.224.464-.168.16-.472.16m2.662 0a.68.68 0 0 1-.368-.096.4.4 0 0 1-.168-.264q-.032-.168.088-.368l2.864-4.632q.137-.224.296-.32a.74.74 0 0 1 .408-.104q.249 0 .408.128a.7.7 0 0 1 .24.384l1.352 4.52a.76.76 0 0 1 .024.416.43.43 0 0 1-.184.248.6.6 0 0 1-.328.088q-.272 0-.416-.128-.135-.136-.208-.416l-.264-1.008.36.256h-3.248l.44-.232-.68 1.168a.8.8 0 0 1-.256.272.7.7 0 0 1-.36.088m2.976-4.392-1.376 2.352-.176-.224h2.432l-.24.248-.624-2.376zm3.432 4.392q-.273 0-.416-.176-.136-.184-.088-.512l.728-4.568q.048-.264.192-.392a.54.54 0 0 1 .376-.136q.24 0 .36.096.127.088.256.296l2.2 3.68h-.216l.552-3.496q.048-.296.208-.432.168-.144.456-.144.272 0 .392.184.128.176.08.496l-.72 4.568q-.04.264-.176.4a.49.49 0 0 1-.36.136.7.7 0 0 1-.384-.096 1 1 0 0 1-.272-.304L45.668 11h.216l-.552 3.496q-.04.288-.192.432t-.44.144"
                                      />
                                    </svg>
                                  </div>
                                  <div className="bg-primary rounded-sm p-1 px-2">
                                    <p className="text-xs text-white">
                                      Disc {discount}%
                                    </p>
                                  </div>
                                </div>
                              )}
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Step 4: Pilih Metode Pembayaran */}
            <div className="overflow-hidden rounded-2xl bg-gray-800">
              {/* Header */}
              <div className="flex items-center gap-4 bg-black/40">
                <div className="bg-primary flex h-10 w-10 items-center justify-center font-semibold text-white">
                  4
                </div>
                <h2 className="font-medium text-white">
                  Pilih salah satu metode pembayaran yang tersedia
                </h2>
              </div>

              <div className="p-4">
                <div className="flex flex-col space-y-4">
                  <div className="group relative">
                    {/* Card */}
                    <div className="group-hover:ring-primary flex cursor-pointer items-center justify-between rounded-md bg-[#313C4C] px-6 py-4 ring-2 ring-transparent transition-all duration-200">
                      {/* Left */}
                      <div className="flex flex-col gap-3">
                        <h2 className="text-sm font-medium text-white">
                          QRIS (Semua Pembayaran)
                        </h2>

                        <div className="flex items-center gap-3">
                          <Image
                            src={qris}
                            alt="QRIS"
                            className="w-18 rounded-sm bg-white object-contain px-2 py-2"
                          />
                        </div>
                      </div>

                      {/* Right */}
                      <div className="text-right">
                        <p className="font-medium text-white">
                          Rp{" "}
                          {(
                            selectedItem
                              ? items.find(
                                  (item: any) => item.id === selectedItem
                                )?.price ||
                                items.find(
                                  (item: any) => item.id === selectedItem
                                )?.sellPrice ||
                                0
                              : items[0]?.price || items[0]?.sellPrice || 0
                          ).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>

                    {/* Best Price Badge */}
                    <div className="absolute -top-2 -right-2 aspect-square w-18 overflow-hidden rounded-sm">
                      <div className="bg-yellow-500/50 absolute top-0 left-0 h-2 w-2"></div>
                      <div className="bg-yellow-500/50 absolute right-0 bottom-0 h-2 w-2"></div>
                      <div className="w-square-diagonal bg-yellow-500 text-black absolute right-0 bottom-0 block w-25 origin-bottom-right rotate-45 py-1 text-center text-xs font-semibold uppercase shadow-sm">
                        Best Price
                      </div>
                    </div>
                  </div>

                  <Accordion
                    type="single"
                    collapsible
                    className="overflow-hidden rounded-md bg-gray-800"
                  >
                    <AccordionItem
                      value="convenience-store"
                      className="group border-none"
                    >
                      <AccordionTrigger className="group flex h-10 w-full items-center justify-between rounded-none border-none bg-black/40 px-6 py-4 hover:no-underline [&>svg]:hidden">
                        <span className="font-medium text-white">
                          Toko Retail
                        </span>

                        <div className="flex items-center">
                          <ChevronDown className="h-5 w-5 text-white transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" />
                        </div>
                      </AccordionTrigger>

                      <div className="flex justify-end gap-2 bg-[#313C4C] px-4 py-2 transition-all duration-200 ease-out group-data-[state=open]:hidden">
                        <Image
                          src={indomaret}
                          alt=""
                          className="w-12 rounded-sm bg-white p-1"
                        />
                        <Image
                          src={alfamart}
                          alt=""
                          className="w-12 rounded-sm bg-white p-1"
                        />
                      </div>

                      <AccordionContent className="bg-[#313C4C] p-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <StoreCard logo="/svg/indomaret.svg" price="58.046" />
                          <StoreCard logo="/svg/alfamart.svg" price="58.046" />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </div>

            {/* Step 5: Masukkan Nomor WhatsApp */}
            <div className="overflow-hidden rounded-2xl bg-gray-800">
              {/* Header */}
              <div className="flex items-center gap-4 bg-black/40">
                <div className="bg-primary flex h-10 w-10 items-center justify-center font-semibold text-white">
                  5
                </div>
                <h2 className="font-medium text-white">
                  Masukkan nomor WhatsApp yang dapat dihubungi
                </h2>
              </div>
              {/* Form */}
              <div className="p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <Label htmlFor="whatsapp" className="mb-2 text-sm text-white">
                      Nomor WhatsApp
                    </Label>
                    <CountryPhoneInput value={phone} onChange={setPhone} />
                  </div>

                  <p className="text-xs text-gray-400">
                    **Nomor ini akan dihubungi jika terjadi masalah atau untuk
                    konfirmasi transaksi
                  </p>

                  <div className="bg-card rounded-md p-4">
                    <p className="flex items-center text-sm text-gray-300">
                      <span>
                        <CircleAlert className="me-2" size={20} />
                      </span>
                      Pastikan nomor WhatsApp aktif dan dapat dihubungi
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 6: Kode Promo */}
            <div className="overflow-hidden rounded-2xl bg-gray-800">
              {/* Header */}
              <div className="flex items-center gap-4 bg-black/40">
                <div className="bg-primary flex h-10 w-10 items-center justify-center font-semibold text-white">
                  6
                </div>
                <h2 className="font-medium text-white">
                  Isi kode promo jika ada
                </h2>
              </div>
              {/* Form */}
              <div className="p-4">
                <div className="flex flex-col">
                  <div className="mb-3 flex gap-4">
                    <Input
                      placeholder="Ketik kode promo Kamu"
                      className="bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400"
                    />
                    <Button className="cursor-pointer">Gunakan</Button>
                  </div>

                  <Button className="w-fit cursor-pointer">
                    <p className="flex items-center gap-2">
                      <span>
                        <TicketPercent />
                      </span>
                      Pakai promo yang tersedia
                    </p>
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 7: Bayar Sekarang */}
            <div className="overflow-hidden rounded-2xl bg-gray-800">
              <div className="p-4">
                <Button className="w-full cursor-pointer bg-primary py-6 text-lg font-semibold">
                  Bayar Sekarang
                </Button>
                <p className="mt-4 text-center text-sm text-gray-400">
                  Klik tombol "Bayar Sekarang" & ikuti instruksi selanjutnya
                </p>
              </div>
            </div>

            {/* Informational Section */}
            <div className="rounded-2xl bg-gray-800 p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                    <span className="text-green-500">✓</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Item tersebut akan secara otomatis ditambahkan ke akun Anda
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                    <span className="text-blue-500">💬</span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Jika Anda mengalami kesulitan, silakan hubungi kami melalui
                    WhatsApp
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoreCard({ logo, price }: { logo: string; price: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-[#2C3544]",
        "transition-all duration-200",
        "hover:ring-primary cursor-pointer hover:ring-2",
      )}
    >
      <div className="flex flex-col gap-3 py-4">
        {/* Logo */}
        <div className="flex items-center justify-start px-4">
          <Image
            src={logo}
            alt="store"
            width={100}
            height={56}
            className="rounded-md bg-white p-2"
          />
        </div>

        {/* Price */}
        <div className="px-4 text-base font-semibold text-white">
          Rp {price}
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-white/20" />

        {/* Fee */}
        <div className="px-4 text-xs text-white/70 italic">
          Biaya Layanan +2000
        </div>
      </div>
    </div>
  );
}
