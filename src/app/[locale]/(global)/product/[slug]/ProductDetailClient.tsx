/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import { productDetail } from "@/lib/data/productDetail";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { calculateTotalWithFees } from "@/lib/payment-fees";

import Lottie from "lottie-react";
import animationData from "public/gif/successconfetti.json";
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

import {
  ChevronDown,
  CircleAlert,
  Headset,
  Minus,
  Plus,
  TicketPercent,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

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

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="h-10 w-10 text-yellow-400"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
    />
  </svg>
);

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
  const [quantity, setQuantity] = useState(1);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [isAgree, setIsAgree] = useState(true);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const MIN_QTY = 1;
  const MAX_QTY = 99;

  const [phone, setPhone] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; coupon: any } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [applicableCouponIds, setApplicableCouponIds] = useState<string[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [productRatings, setProductRatings] = useState<{ averageRating: number; totalRatings: number; ratings: any[] } | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(false);
  
  // Credit card form state
  const [creditCardData, setCreditCardData] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
  });
  const [creditCardErrors, setCreditCardErrors] = useState<{
    cardNumber?: string;
    cardholderName?: string;
    expiryDate?: string;
    cvv?: string;
  }>({});
  
  // Account verification state
  const [userId, setUserId] = useState("");
  const [serverId, setServerId] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifiedAccount, setVerifiedAccount] = useState<{ userId: string; serverId: string } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Get user session
  const { data: session } = useSession();

  // Handle client-side mounting to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-fill phone number from user session
  useEffect(() => {
    if (session?.user?.phone && !phone) {
      setPhone(session.user.phone);
    }
  }, [session, phone]);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/payment-methods?isActive=true");
        const data = await response.json();
        if (data.success && data.data) {
          setPaymentMethods(data.data);
          // Auto-select QRIS if available
          const qrisMethod = data.data.find((pm: any) => pm.type === "QRIS");
          if (qrisMethod) {
            setSelectedPaymentMethod(qrisMethod.id);
          } else if (data.data.length > 0) {
            setSelectedPaymentMethod(data.data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment methods:", error);
      }
    };
    fetchPaymentMethods();
  }, []);

  if (!product) {
    return <div className="mt-96 text-white">Produk tidak ditemukan</div>;
  }

  // Get items - use database items if available, otherwise use hardcoded denominations
  // Sort items by price (ascending)
  const allItems = (
    productData?.items ||
    (product as any).denominations ||
    []
  ).sort((a: any, b: any) => {
    const priceA = a.price || a.sellPrice || 0;
    const priceB = b.price || b.sellPrice || 0;
    return priceA - priceB;
  });

  // Group items by group field from database, with fallback to SKU pattern matching
  const groupedItemsMap = new Map<string, any[]>();
  
  allItems.forEach((item: any) => {
    let groupName = item.group || "";
    
    // Fallback: If no group field, try to infer from SKU code (for backward compatibility)
    if (!groupName) {
      const skuCode = item.skuCode || "";
      if (skuCode.startsWith("MLID") || skuCode.includes("DIAMOND")) {
        groupName = "Diamond";
      } else if (skuCode.includes("WEEK") || skuCode.includes("PASS")) {
        groupName = "Weekly Pass";
      }
    }
    
    // If still no group, put in "Other" group
    if (!groupName) {
      groupName = "Other";
    }
    
    if (!groupedItemsMap.has(groupName)) {
      groupedItemsMap.set(groupName, []);
    }
    groupedItemsMap.get(groupName)!.push(item);
  });

  // Convert map to object for easier access
  const groupedItems: Record<string, any[]> = {};
  groupedItemsMap.forEach((items, groupName) => {
    groupedItems[groupName] = items;
  });

  // Flatten grouped items for selection
  const items = allItems;

  // Credit card validation functions
  const validateCardNumber = (cardNumber: string): string | undefined => {
    const cleaned = cardNumber.replace(/\s/g, "");
    if (!cleaned) return "Card number is required";
    if (cleaned.length < 13 || cleaned.length > 19) return "Card number must be 13-19 digits";
    // Luhn algorithm check
    let sum = 0;
    let isEven = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      const char = cleaned[i];
      if (!char) continue;
      let digit = parseInt(char, 10);
      if (isNaN(digit)) continue;
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    if (sum % 10 !== 0) return "Invalid card number";
    return undefined;
  };

  const validateExpiryDate = (expiryDate: string): string | undefined => {
    if (!expiryDate) return "Expiry date is required";
    const [month, year] = expiryDate.split("/");
    if (!month || !year || month.length !== 2 || year.length !== 2) return "Invalid format (MM/YY)";
    const monthNum = parseInt(month);
    const yearNum = parseInt("20" + year);
    if (isNaN(monthNum) || isNaN(yearNum)) return "Invalid format (MM/YY)";
    if (monthNum < 1 || monthNum > 12) return "Invalid month";
    const now = new Date();
    const expiry = new Date(yearNum, monthNum - 1);
    if (expiry < now) return "Card has expired";
    return undefined;
  };

  const validateCVV = (cvv: string): string | undefined => {
    if (!cvv) return "CVV is required";
    if (!/^\d{3,4}$/.test(cvv)) return "CVV must be 3-4 digits";
    return undefined;
  };

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, "").replace(/\D/g, "");
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    return formatted.slice(0, 19); // Max 16 digits + 3 spaces
  };

  const formatExpiryDate = (value: string): string => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCreditCardData({ ...creditCardData, cardNumber: formatted });
    if (creditCardErrors.cardNumber) {
      const error = validateCardNumber(formatted);
      setCreditCardErrors({ ...creditCardErrors, cardNumber: error || undefined });
    }
  };

  const handleExpiryDateChange = (value: string) => {
    const formatted = formatExpiryDate(value);
    setCreditCardData({ ...creditCardData, expiryDate: formatted });
    if (creditCardErrors.expiryDate) {
      const error = validateExpiryDate(formatted);
      setCreditCardErrors({ ...creditCardErrors, expiryDate: error });
    }
  };

  const handleCVVChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    setCreditCardData({ ...creditCardData, cvv: cleaned });
    if (creditCardErrors.cvv) {
      const error = validateCVV(cleaned);
      setCreditCardErrors({ ...creditCardErrors, cvv: error });
    }
  };

  // Handle coupon validation and application
  const handleApplyCoupon = async (code?: string) => {
    const couponToValidate = code || couponCode.trim();
    if (!couponToValidate || !selectedItemData) return;
    
    setValidatingCoupon(true);
    setCouponError(null);
    if (code) {
      setCouponCode(code);
    }

    try {
      const baseAmount = productPrice * quantity;
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponToValidate.toUpperCase(),
          orderAmount: baseAmount,
        }),
      });

      const data = await response.json();

      if (data.success && data.valid) {
        setAppliedCoupon({
          code: couponToValidate.toUpperCase(),
          discountAmount: data.discountAmount,
          coupon: data.coupon,
        });
        setCouponError(null);
        toast.success("Kode promo berhasil diterapkan!");
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || "Kode promo tidak valid");
      }
    } catch (error) {
      setAppliedCoupon(null);
      setCouponError("Terjadi kesalahan saat memvalidasi kode promo");
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Handle account verification
  const handleVerifyAccount = async () => {
    // Use zoneId if available, otherwise use serverId
    const serverOrZoneId = zoneId || serverId;
    
    if (!userId || !serverOrZoneId) {
      setVerificationError("User ID dan Server ID harus diisi");
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const response = await fetch("/api/products/verify-ml-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId.trim(),
          serverId: serverOrZoneId.trim(),
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.verified) {
        setIsVerified(true);
        setVerifiedAccount({
          userId: userId.trim(),
          serverId: serverOrZoneId.trim(),
        });
        setVerificationError(null);
      } else {
        setIsVerified(false);
        setVerificationError(data.message || "Gagal memverifikasi akun. Pastikan User ID dan Server ID benar.");
      }
    } catch (error) {
      setIsVerified(false);
      setVerificationError("Terjadi kesalahan saat memverifikasi akun. Silakan coba lagi.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Check if this is Mobile Legends product
  // Check by slug or by input fields (userId and serverId/zoneId)
  const hasUserIdField = product?.inputFields?.some((field) => field.name === "userId") || false;
  const hasServerField = product?.inputFields?.some((field) => field.name === "serverId" || field.name === "zoneId") || false;
  const isMobileLegends = 
    slug.includes("mobile-legends") || 
    productData?.slug?.includes("mobile-legends") ||
    (hasUserIdField && hasServerField);

  const selectedItemData = selectedItem
    ? items.find((item: any) => item.id === selectedItem)
    : null;

  const productPrice =
    selectedItemData?.price || selectedItemData?.sellPrice || 0;

  // Get selected payment method
  const selectedPaymentMethodData = selectedPaymentMethod
    ? paymentMethods.find((pm: any) => pm.id === selectedPaymentMethod)
    : null;

  // Fetch available coupons (moved here so selectedItemData and productPrice are available)
  useEffect(() => {
    const fetchCoupons = async () => {
      if (!selectedItemData) return;
      
      setLoadingCoupons(true);
      try {
        const baseAmount = productPrice * quantity;
        const response = await fetch(`/api/coupons?orderAmount=${baseAmount}`);
        const data = await response.json();
        if (data.success && data.data) {
          setAvailableCoupons(data.data);
          if (data.applicable) {
            setApplicableCouponIds(data.applicable);
          }
        }
      } catch (error) {
        console.error("Failed to fetch coupons:", error);
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchCoupons();
  }, [selectedItemData, productPrice, quantity]);

  // Fetch product ratings
  useEffect(() => {
    const fetchRatings = async () => {
      if (!slug) return;
      
      setLoadingRatings(true);
      try {
        const response = await fetch(`/api/products/${slug}/ratings`);
        const data = await response.json();
        if (data.success && data.data) {
          setProductRatings(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch ratings:", error);
      } finally {
        setLoadingRatings(false);
      }
    };
    fetchRatings();
  }, [slug]);

  // Calculate coupon discount
  const couponDiscount = appliedCoupon?.discountAmount || 0;

  // Calculate base amount after coupon discount
  const baseAmountAfterCoupon = useMemo(() => {
    const baseAmount = productPrice * quantity;
    return Math.max(0, baseAmount - couponDiscount);
  }, [productPrice, quantity, couponDiscount]);

  // Calculate fees dynamically based on selected payment method
  const feeCalculation = useMemo(() => {
    if (!selectedPaymentMethodData || baseAmountAfterCoupon === 0) {
      return {
        baseAmount: baseAmountAfterCoupon,
        paymentFee: 0,
        vatAmount: 0,
        totalAmount: baseAmountAfterCoupon,
      };
    }

    return calculateTotalWithFees(baseAmountAfterCoupon, selectedPaymentMethodData);
  }, [baseAmountAfterCoupon, selectedPaymentMethodData]);

  const { paymentFee, vatAmount, totalAmount } = feeCalculation;

  return (
    <section className="mt-12">
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
          <div className="-mt-54 w-52 shrink-0 pb-8">
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
        <div className="grid grid-cols-3 gap-8 h-full">
          {/* KONTEN KIRI */}
          <div className="col-span-2 ">
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
                <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2" data-verification-section>
                  {/* ID */}
                  {product.inputFields.map((field) => (
                    <div key={field.name}>
                      <Label className="mb-2 flex items-center gap-2 text-sm text-white">
                        {field.label}
                        {field.name === "userId" && field.dialog && isMounted && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                type="button"
                                className="cursor-pointer text-xs text-gray-400"
                                suppressHydrationWarning
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
                        {field.name === "userId" && field.dialog && !isMounted && (
                          <button
                            type="button"
                            className="cursor-pointer text-xs text-gray-400"
                            disabled
                          >
                            ⓘ
                          </button>
                        )}
                      </Label>
                      <Input
                        placeholder={field.label}
                        type="number"
                        value={
                          field.name === "userId" 
                            ? userId 
                            : field.name === "serverId" || field.name === "zoneId"
                            ? (field.name === "serverId" ? serverId : zoneId)
                            : ""
                        }
                        onChange={(e) => {
                          if (field.name === "userId") {
                            setUserId(e.target.value);
                            setIsVerified(false); // Reset verification when user changes ID
                          } else if (field.name === "serverId") {
                            setServerId(e.target.value);
                            setIsVerified(false); // Reset verification when user changes server
                          } else if (field.name === "zoneId") {
                            setZoneId(e.target.value);
                            setServerId(e.target.value); // Also update serverId for compatibility
                            setIsVerified(false); // Reset verification when user changes zone
                          }
                        }}
                        readOnly={false}
                        className="bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Verify Button for Mobile Legends */}
                {isMobileLegends && (
                  <div className="px-4 pb-4">
                    <Button
                      type="button"
                      onClick={handleVerifyAccount}
                      disabled={isVerifying || !userId || (!serverId && !zoneId)}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memverifikasi...
                        </>
                      ) : isVerified ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Akun Terverifikasi
                        </>
                      ) : (
                        "Verifikasi Akun"
                      )}
                    </Button>
                    {verificationError && (
                      <p className="mt-2 text-sm text-red-400">{verificationError}</p>
                    )}
                    {isVerified && verifiedAccount && (
                      <p className="mt-2 text-sm text-green-400">
                        ✓ User ID: {verifiedAccount.userId} | Server: {verifiedAccount.serverId}
                      </p>
                    )}
                  </div>
                )}

                <p className="px-4 pb-4 text-sm text-gray-300">
                  Pastikan User ID dan Server ID yang Anda masukkan sudah benar.
                </p>
              </div>

              {/* Step 2: Pilih Nominal */}
              <div className="overflow-hidden rounded-2xl bg-gray-800">
                  {/* Header */}
                  <div className="flex items-center gap-4 bg-black/40">
                    <div className="bg-primary flex h-10 w-10 items-center justify-center font-semibold text-white">
                      2
                    </div>
                    <h2 className="font-medium text-white">Pilih Nominal</h2>
                  </div>
                  {/* Form */}
                  <div className="gap-6 p-4 md:grid-cols-2">
                    {items.length > 0 && (
                      <>
                        {/* Render groups dynamically */}
                        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                          groupItems.length > 0 && (
                            <div key={groupName} className="mb-6">
                              <div className="mb-4">
                                <h1 className="mb-4 text-lg font-semibold text-white">
                                  {groupName === "Diamond" && "💎 "}
                                  {groupName === "Weekly Pass" && "🎫 "}
                                  {groupName}
                                </h1>
                              </div>
                              <div className={`grid grid-cols-3 gap-4 ${Object.keys(groupedItems).indexOf(groupName) < Object.keys(groupedItems).length - 1 ? "mb-6" : ""}`}>
                                {groupItems.map((item: any) => {
                                // Price logic: Use discountedPrice if available, otherwise use sellPrice
                                const discountedPrice = item.discountedPrice || null;
                                const normalPrice = item.normalPrice || item.basePrice || 0;
                                const sellPrice = item.sellPrice || item.price || 0;
                                
                                // Current displayed price: discountedPrice if available, otherwise sellPrice
                                const itemPrice = discountedPrice || sellPrice;
                                
                                // Original price for comparison (normalPrice for discount calculation)
                                const originalPrice = discountedPrice ? normalPrice : (item.basePrice || normalPrice);
                                
                                // Calculate discount percentage
                                const discount = originalPrice > itemPrice && originalPrice > 0
                                  ? Math.round(
                                      ((originalPrice - itemPrice) / originalPrice) * 100
                                    )
                                  : 0;
                                
                                const hasDiscount = discount > 0 && discountedPrice !== null;
                                const isSelected = selectedItem === item.id;

                                return (
                                  <Card
                                    key={item.id}
                                    onClick={() => {
                                      // For Mobile Legends, prompt account validation before selecting nominal
                                      if (isMobileLegends && !isVerified) {
                                        toast.error("Verifikasi Akun Diperlukan", {
                                          description: "Silakan verifikasi akun Mobile Legends Anda terlebih dahulu sebelum memilih nominal.",
                                          action: {
                                            label: "Verifikasi Sekarang",
                                            onClick: () => {
                                              document.querySelector('[data-verification-section]')?.scrollIntoView({ behavior: 'smooth' });
                                            },
                                          },
                                        });
                                        return;
                                      }
                                      setSelectedItem(item.id);
                                    }}
                                    className={cn(
                                      "group cursor-pointer overflow-hidden border-0 bg-[#313C4C] bg-[url(/img/background.png)] bg-cover bg-no-repeat px-0 py-0 pt-4 transition-all hover:outline-2 hover:outline-rose-500",
                                      isSelected && "outline-2 outline-rose-500",
                                    )}
                                  >
                                    <CardHeader className="-mb-5">
                                      <CardTitle className="text-sm text-white">
                                        {item.name}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="-mb-2 flex items-center gap-4">
                                      <Image
                                        src={item.iconImage || wdp}
                                        alt={item.name}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 object-cover transition-transform duration-300 group-hover:rotate-10"
                                      />
                                      <div>
                                        <h1 className="text-base font-semibold text-yellow-500">
                                          Rp {itemPrice.toLocaleString("id-ID")}
                                        </h1>
                                        {hasDiscount && normalPrice > itemPrice && (
                                          <p className="text-primary text-xs line-through">
                                            Rp {normalPrice.toLocaleString("id-ID")}
                                          </p>
                                        )}
                                        {!hasDiscount && originalPrice > itemPrice && originalPrice !== normalPrice && (
                                          <p className="text-primary text-xs line-through">
                                            Rp {originalPrice.toLocaleString("id-ID")}
                                          </p>
                                        )}
                                      </div>
                                    </CardContent>
                                    <CardFooter className="from-card to-card/40 flex justify-end bg-linear-to-t p-3 px-3">
                                      {hasDiscount && discount > 0 && (
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
                                                d="M20.582 5.042q-.15 0-.222-.096-.066-.096-.048-.264l.576-3.606q.024-.156.114-.228a.35.35 0 0 1 .24-.078h1.272q.672 0 1.032.294t.36.864q0 .66-.414 1.044t-1.206.384H21.14l-.216 1.38a.4.4 0 0 1-.108.234.35.35 0 0 1-.234.072m.642-2.184h1.098q.48 0 .726-.228.252-.228.252-.66 0-.36-.216-.528-.21-.174-.636-.174h-.972zm4.225 2.196q-.432 0-.75-.156a1.2 1.2 0 0 1-.486-.456 1.4 1.4 0 0 1-.168-.696q0-.48.198-.87t.552-.624q.36-.234.834-.234.354 0 .594.126.24.12.378.33t.18.474q.048.264.018.54-.012.114-.06.15a.23.23 0 0 1-.138.036h-2.076l.048-.372h1.842l-.108.084a1.1 1.1 0 0 0-.018-.474.6.6 0 0 0-.216-.336q-.162-.132-.45-.132a.87.87 0 0 0-.498.138.95.95 0 0 0-.312.342q-.108.21-.15.444l-.024.162q-.084.48.144.768.234.288.708.288.198 0 .396-.048a1.2 1.2 0 0 0 .366-.156.3.3 0 0 1 .168-.048q.078 0 .12.048a.2.2 0 0 1 .06.12.24.24 0 0 1-.024.144.3.3 0 0 1-.114.126 1.5 1.5 0 0 1-.486.216 2.3 2.3 0 0 1-.528.066m2.155-.012q-.138 0-.204-.096t-.042-.264l.372-2.352a.34.34 0 0 1 .114-.222.34.34 0 0 1 .234-.078q.132 0 .198.084t.036.252l-.066.444-.036-.102q.15-.336.432-.51.288-.18.678-.18.324 0 .54.132a.7.7 0 0 1 .312.402q.096.27.03.684l-.234 1.506a.34.34 0 0 1-.108.228.37.37 0 0 1-.24.072q-.144 0-.21-.096t-.042-.258l.228-1.44q.06-.378-.06-.558-.12-.186-.432-.186-.402 0-.642.246-.234.246-.3.672l-.21 1.32q-.042.3-.348.3m4.567 1.092q-.354 0-.666-.09a2 2 0 0 1-.552-.234.25.25 0 0 1-.114-.12.25.25 0 0 1-.006-.144.3.3 0 0 1 .066-.126.25.25 0 0 1 .126-.06.25.25 0 0 1 .168.042q.198.12.42.192t.474.072q.378 0 .606-.18.234-.18.3-.57l.102-.63.048.006q-.144.3-.426.468a1.23 1.23 0 0 1-.642.168 1.3 1.3 0 0 1-.618-.144 1.04 1.04 0 0 1-.408-.414 1.35 1.35 0 0 1-.144-.642q0-.336.102-.642a1.7 1.7 0 0 1 .294-.552q.192-.24.462-.378.276-.138.624-.138.354 0 .624.174.27.168.372.51l-.066.12.078-.498a.35.35 0 0 1 .108-.222.36.36 0 0 1 .234-.072q.144 0 .204.096.06.09.036.258l-.396 2.502q-.096.618-.45.93-.348.318-.96.318m.078-1.68a.83.83 0 0 0 .528-.168 1 1 0 0 0 .324-.444q.114-.282.114-.6 0-.354-.192-.552t-.546-.198a.83.83 0 0 0-.522.168q-.216.168-.33.444a1.6 1.6 0 0 0-.108.594q0 .36.192.558t.54.198m2.548.588q-.138 0-.204-.09-.066-.096-.042-.264l.378-2.358a.35.35 0 0 1 .108-.222.35.35 0 0 1 .24-.078q.138 0 .204.096.066.09.042.258l-.378 2.358a.4.4 0 0 1-.108.228.36.36 0 0 1-.24.072m.582-3.624q-.168 0-.252-.084t-.072-.234a.37.37 0 0 1 .132-.27.45.45 0 0 1 .3-.096q.174 0 .258.084t.072.234a.4.4 0 0 1-.132.276.47.47 0 0 1-.306.09m.973 3.624q-.144 0-.21-.09T36.1 4.7l.378-2.376a.35.35 0 0 1 .108-.222.36.36 0 0 1 .234-.072q.138 0 .204.09.066.084.042.252L37 2.774h-.06q.12-.354.408-.546.288-.198.66-.216.15-.006.198.042.054.048.054.168 0 .156-.072.228t-.234.09l-.144.018q-.444.042-.636.264t-.258.606l-.21 1.326a.31.31 0 0 1-.108.216.4.4 0 0 1-.246.072m2.322 0q-.138 0-.204-.09-.066-.096-.042-.264l.378-2.358a.35.35 0 0 1 .108-.222.35.35 0 0 1 .24-.078q.138 0 .204.096.066.09.042.258l-.378 2.358a.4.4 0 0 1-.108.228.36.36 0 0 1-.24.072m.582-3.624q-.168 0-.252-.084t-.072-.234a.37.37 0 0 1 .132-.27.45.45 0 0 1 .3-.096q.174 0 .258.084t.072.234a.4.4 0 0 1-.132.276.47.47 0 0 1-.306.09m.98 3.624q-.139 0-.205-.09T39.99 4.7l.378-2.376a.35.35 0 0 1 .108-.222.35.35 0 0 1 .228-.072q.138 0 .204.09t.042.252l-.072.456-.048-.108q.168-.354.438-.528.276-.174.6-.174.342 0 .516.132a.7.7 0 0 1 .3.402q.084.27.018.69l-.24 1.512a.34.34 0 0 1-.102.216.35.35 0 0 1-.234.072q-.15 0-.216-.09t-.042-.252l.228-1.476q.054-.36-.054-.54t-.39-.18a.71.71 0 0 0-.552.246q-.216.24-.288.672l-.204 1.332a.36.36 0 0 1-.114.216.36.36 0 0 1-.234.072q-.144 0-.216-.09-.066-.09-.042-.252l.24-1.476q.054-.36-.06-.54-.108-.18-.384-.18a.72.72 0 0 0-.558.246q-.216.24-.288.672l-.21 1.332q-.042.288-.354.288m5.965.012q-.258 0-.48-.114a1 1 0 0 1-.354-.318.8.8 0 0 1-.132-.456q0-.312.168-.504.174-.192.54-.282a3.8 3.8 0 0 1 .942-.096h.48l-.054.372h-.372a4 4 0 0 0-.66.042q-.24.042-.342.15a.38.38 0 0 0-.102.282q0 .24.156.366a.6.6 0 0 0 .384.126.81.81 0 0 0 .672-.348.9.9 0 0 0 .162-.414l.114-.72q.054-.318-.09-.486-.138-.168-.498-.168-.21 0-.408.042a1.6 1.6 0 0 0-.39.144.27.27 0 0 1-.168.036.25.25 0 0 1-.126-.066.2.2 0 0 1-.054-.126.24.24 0 0 1 .036-.144.4.4 0 0 1 .156-.126q.24-.12.51-.174t.516-.054q.438 0 .69.162a.8.8 0 0 1 .348.45 1.4 1.4 0 0 1 .036.666l-.228 1.446a.34.34 0 0 1-.108.228.33.33 0 0 1-.222.072q-.132 0-.198-.084-.066-.09-.042-.252l.066-.438.048.09a1 1 0 0 1-.594.624 1.1 1.1 0 0 1-.402.072m2.628-.012q-.138 0-.204-.096t-.042-.264l.372-2.352a.34.34 0 0 1 .114-.222.34.34 0 0 1 .234-.078q.132 0 .198.084t.036.252l-.066.444-.036-.102q.15-.336.432-.51.288-.18.678-.18.324 0 .54.132a.7.7 0 0 1 .312.402q.096.27.03.684l-.234 1.506a.34.34 0 0 1-.108.228.37.37 0 0 1-.24.072q-.144 0-.21-.096t-.042-.258l.228-1.44q.06-.378-.06-.558-.12-.186-.432-.186-.402 0-.642.246-.234.246-.3.672l-.21 1.32q-.042.3-.348.3M20.896 15.072q-.32 0-.456-.192-.135-.2-.08-.544l.704-4.424q.048-.312.224-.464.176-.16.48-.16.312 0 .44.192.135.193.08.544l-.704 4.416q-.048.312-.216.472t-.472.16m2.335 0q-.272 0-.416-.176-.135-.184-.088-.512l.728-4.568q.048-.264.192-.392a.54.54 0 0 1 .376-.136q.24 0 .36.096.127.088.256.296l2.2 3.68h-.216l.552-3.496q.048-.296.208-.432.168-.144.456-.144.272 0 .392.184.128.176.08.496l-.72 4.568q-.04.264-.176.4a.49.49 0 0 1-.36.136.7.7 0 0 1-.384-.096 1 1 0 0 1-.272-.304L24.199 11h.216l-.552 3.496q-.04.288-.192.432t-.44.144m7.576.016a4.5 4.5 0 0 1-1.304-.192 4 4 0 0 1-.584-.248.6.6 0 0 1-.256-.256.6.6 0 0 1-.04-.32.54.54 0 0 1 .128-.28.44.44 0 0 1 .264-.16q.16-.04.368.064.368.192.768.28.408.08.768.08.512 0 .792-.184.288-.184.288-.472a.5.5 0 0 0-.168-.384q-.168-.152-.56-.24l-.904-.216q-.593-.136-.944-.504-.344-.368-.344-.952 0-.432.176-.768.183-.344.504-.576.327-.24.744-.36.423-.128.888-.128.399 0 .864.104.471.104.872.344a.537.537 0 0 1 .264.552.45.45 0 0 1-.12.264.45.45 0 0 1-.272.144q-.168.024-.408-.088a2.4 2.4 0 0 0-.592-.208 2.6 2.6 0 0 0-.624-.08q-.32 0-.568.088a.9.9 0 0 0-.376.24.54.54 0 0 0-.128.36q0 .24.152.384.16.136.472.216l.896.216q.687.16 1.04.536.36.375.36.904 0 .465-.192.808t-.536.576a2.6 2.6 0 0 1-.776.344 3.6 3.6 0 0 1-.912.112m4.823-.016q-.303 0-.448-.192-.135-.2-.08-.536l.624-3.96h-1.312q-.255 0-.4-.112a.37.37 0 0 1-.144-.304q0-.288.16-.448.168-.16.456-.16h3.96q.264 0 .4.112.144.104.144.296 0 .288-.16.456-.16.16-.448.16h-1.408l-.648 4.064q-.047.304-.224.464-.168.16-.472.16m2.662 0a.68.68 0 0 1-.368-.096.4.4 0 0 1-.168-.264q-.032-.168.088-.368l2.864-4.632q.137-.224.296-.32a.74.74 0 0 1 .408-.104q.249 0 .408.128a.7.7 0 0 1 .24.384l1.352 4.52a.76.76 0 0 1 .024.416.43.43 0 0 1-.184.248.6.6 0 0 1-.328.088q-.272 0-.416-.128-.135-.136-.208-.416l-.264-1.008.36.256h-3.248l.44-.232-.68 1.168a.8.8 0 0 1-.256.272.7.7 0 0 1-.36.088m2.976-4.392-1.376 2.352-.176-.224h2.432l-.24.248-.624-2.376zm3.432 4.392q-.273 0-.416-.176-.136-.184-.088-.512l.728-4.568q.048-.264.192-.392a.54.54 0 0 1 .376-.136q.24 0 .36.096.127.088.256.296l2.2 3.68h-.216l.552-3.496q.048-.296.208-.432.168-.144.456-.144.272 0 .392.184.128.176.08.496l-.72 4.568q-.04.264-.176.4a.49.49 0 0 1-.36.136.7.7 0 0 1-.384-.096 1 1 0 0 1-.272-.304L45.668 11h.216l-.552 3.496q-.04.288-.192.432t-.44.144"
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
                            </div>
                          )
                        ))}

                        {/* Fallback: Show all items if no grouping */}
                        {Object.keys(groupedItems).length === 0 && (
                          <>
                            <div>
                              <h1 className="mb-4 text-sm text-white">
                                ✨ Pilih Nominal
                              </h1>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              {items.map((item: any) => {
                                // Price logic: Use discountedPrice if available, otherwise use sellPrice
                                const discountedPrice = item.discountedPrice || null;
                                const normalPrice = item.normalPrice || item.basePrice || 0;
                                const sellPrice = item.sellPrice || item.price || 0;
                                
                                // Current displayed price: discountedPrice if available, otherwise sellPrice
                                const itemPrice = discountedPrice || sellPrice;
                                
                                // Original price for comparison (normalPrice for discount calculation)
                                const originalPrice = discountedPrice ? normalPrice : (item.basePrice || normalPrice);
                                
                                // Calculate discount percentage
                                const discount = originalPrice > itemPrice && originalPrice > 0
                                  ? Math.round(
                                      ((originalPrice - itemPrice) / originalPrice) * 100
                                    )
                                  : 0;
                                
                                const hasDiscount = discount > 0 && discountedPrice !== null;
                                const isSelected = selectedItem === item.id;

                                return (
                                  <Card
                                    key={item.id}
                                    onClick={() => {
                                      // For Mobile Legends, prompt account validation before selecting nominal
                                      if (isMobileLegends && !isVerified) {
                                        toast.error("Verifikasi Akun Diperlukan", {
                                          description: "Silakan verifikasi akun Mobile Legends Anda terlebih dahulu sebelum memilih nominal.",
                                          action: {
                                            label: "Verifikasi Sekarang",
                                            onClick: () => {
                                              document.querySelector('[data-verification-section]')?.scrollIntoView({ behavior: 'smooth' });
                                            },
                                          },
                                        });
                                        return;
                                      }
                                      setSelectedItem(item.id);
                                    }}
                                    className={cn(
                                      "group cursor-pointer overflow-hidden border-0 bg-[#313C4C] bg-[url(/img/background.png)] bg-cover bg-no-repeat px-0 py-0 pt-4 transition-all hover:outline-2 hover:outline-rose-500",
                                      isSelected && "outline-2 outline-rose-500",
                                    )}
                                  >
                                    <CardHeader className="-mb-5">
                                      <CardTitle className="text-sm text-white">
                                        {item.name}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="-mb-2 flex items-center gap-4">
                                      <Image
                                        src={item.iconImage || wdp}
                                        alt={item.name}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 object-cover transition-transform duration-300 group-hover:rotate-10"
                                      />
                                      <div>
                                        <h1 className="text-base font-semibold text-yellow-500">
                                          Rp {itemPrice.toLocaleString("id-ID")}
                                        </h1>
                                        {hasDiscount && normalPrice > itemPrice && (
                                          <p className="text-primary text-xs line-through">
                                            Rp {normalPrice.toLocaleString("id-ID")}
                                          </p>
                                        )}
                                        {!hasDiscount && originalPrice > itemPrice && originalPrice !== normalPrice && (
                                          <p className="text-primary text-xs line-through">
                                            Rp {originalPrice.toLocaleString("id-ID")}
                                          </p>
                                        )}
                                      </div>
                                    </CardContent>
                                    <CardFooter className="from-card to-card/40 flex justify-end bg-linear-to-t p-3 px-3">
                                      {hasDiscount && discount > 0 && (
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
                      </>
                    )}
                  </div>
                </div>

              <div className="overflow-hidden rounded-2xl bg-gray-800">
                {/* Header */}
                <div className="flex items-center gap-4 bg-black/40">
                  <div className="bg-primary flex h-10 w-10 items-center justify-center font-semibold text-white">
                    3
                  </div>
                  <h2 className="font-medium text-white">
                    Masukkan Jumlah Pembelian
                  </h2>
                </div>

                {/* Form */}
                <div className="p-4">
                  {/* Input */}
                  <div className="flex items-center gap-4">
                    <div className="flex w-full items-center gap-4">
                      <Input
                        placeholder="Ketik kode promo Kamu"
                        className="bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400"
                        value={quantity}
                        min={1}
                        readOnly
                      />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        className="bg-primary h-9 w-9 cursor-pointer rounded-md"
                        onClick={() =>
                          setQuantity((q) => Math.min(q + 1, MAX_QTY))
                        }
                      >
                        <Plus />
                      </Button>

                      <Button
                        type="button"
                        className="bg-primary h-9 w-9 cursor-pointer rounded-md"
                        onClick={() =>
                          setQuantity((q) => Math.max(q - 1, MIN_QTY))
                        }
                      >
                        <Minus />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Pilih Metode Pembayaran */}
              <div className="overflow-hidden rounded-2xl bg-gray-800">
                {/* Header */}
                <div className="flex items-center gap-4 bg-black/40">
                  <div className="bg-primary flex h-10 w-10 items-center justify-center font-semibold text-white">
                    4
                  </div>
                  <h2 className="font-medium text-white">Metode Pembayaran</h2>
                </div>

                <div className="p-4">
                  <div className="flex flex-col space-y-3">
                    <Accordion
                      type="single"
                      collapsible
                      defaultValue="qris-ewallet"
                      className="w-full space-y-3"
                    >
                      {/* E-Wallet & QRIS Group */}
                      {paymentMethods.filter((pm: any) => pm.type === "QRIS" || pm.type === "E_WALLET").length > 0 && (
                        <div className="overflow-hidden rounded-md bg-gray-800">
                          <AccordionItem value="qris-ewallet" className="group border-none">
                            <AccordionTrigger className="group flex h-10 w-full items-center justify-between rounded-none border-none bg-black/40 px-6 py-4 hover:no-underline [&>svg]:hidden">
                              <span className="font-medium text-white uppercase tracking-wide">
                                💳 E-Wallet & QRIS
                              </span>
                              <div className="flex items-center">
                                <ChevronDown className="h-5 w-5 text-white transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" />
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="bg-[#313C4C] p-4">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {paymentMethods
                                  .filter((pm: any) => pm.type === "QRIS" || pm.type === "E_WALLET")
                                  .map((pm: any) => {
                                    const isSelected = selectedPaymentMethod === pm.id;
                                    const isQRIS = pm.type === "QRIS";
                                    return (
                                      <div key={pm.id}>
                                        <div
                                          onClick={() => setSelectedPaymentMethod(pm.id)}
                                          className={cn(
                                            "rounded-lg bg-[#2C3544] p-4 transition-all duration-200 cursor-pointer flex flex-col items-center gap-3",
                                            isSelected ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary"
                                          )}
                                        >
                                          {pm.icon && (
                                            <Image
                                              src={pm.icon}
                                              alt={pm.name}
                                              width={80}
                                              height={48}
                                              className="rounded-md bg-white object-contain p-2"
                                            />
                                          )}
                                          {isQRIS && !pm.icon && (
                                            <Image
                                              src={qris}
                                              alt="QRIS"
                                              className="w-20 rounded-sm bg-white object-contain px-2 py-2"
                                            />
                                          )}
                                          <h3 className="font-medium text-white text-center text-sm">{pm.name}</h3>
                                          {pm.description && (
                                            <p className="text-xs text-gray-400 text-center">{pm.description}</p>
                                          )}
                                          {selectedItemData && (() => {
                                            const baseAmount = baseAmountAfterCoupon;
                                            const pmTotal = calculateTotalWithFees(baseAmount, pm);
                                            return (
                                              <div className="text-center w-full pt-2 border-t border-gray-600">
                                                <p className="text-sm font-medium text-white">
                                                  Rp {pmTotal.totalAmount.toLocaleString("id-ID")}
                                                </p>
                                                {(pmTotal.paymentFee > 0 || pmTotal.vatAmount > 0) && (
                                                  <p className="text-xs text-gray-400">
                                                    Termasuk biaya & PPN
                                                  </p>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </div>
                      )}

                      {/* Credit Card Group */}
                      {paymentMethods.filter((pm: any) => pm.type === "CREDIT_CARD").length > 0 && (
                        <div className="overflow-hidden rounded-md bg-gray-800">
                          <AccordionItem value="credit-card" className="group border-none">
                            <AccordionTrigger className="group flex h-10 w-full items-center justify-between rounded-none border-none bg-black/40 px-6 py-4 hover:no-underline [&>svg]:hidden">
                              <span className="font-medium text-white uppercase tracking-wide">
                                💳 Kartu Kredit
                              </span>
                              <div className="flex items-center">
                                <ChevronDown className="h-5 w-5 text-white transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" />
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="bg-[#313C4C] p-4">
                              <div className="space-y-4">
                                {paymentMethods
                                  .filter((pm: any) => pm.type === "CREDIT_CARD")
                                  .map((pm: any) => {
                                    const isSelected = selectedPaymentMethod === pm.id;
                                    return (
                                      <div key={pm.id}>
                                        <div
                                          onClick={() => {
                                            setSelectedPaymentMethod(pm.id);
                                            if (!isSelected) {
                                              setCreditCardData({
                                                cardNumber: "",
                                                cardholderName: "",
                                                expiryDate: "",
                                                cvv: "",
                                              });
                                              setCreditCardErrors({});
                                            }
                                          }}
                                          className={cn(
                                            "flex cursor-pointer items-center justify-between rounded-md bg-[#2C3544] px-6 py-4 ring-2 transition-all duration-200",
                                            isSelected ? "ring-primary" : "ring-transparent hover:ring-primary"
                                          )}
                                        >
                                          <div className="flex items-center gap-4">
                                            {pm.icon && (
                                              <Image
                                                src={pm.icon}
                                                alt={pm.name}
                                                width={48}
                                                height={48}
                                                className="rounded-md bg-white object-contain p-2"
                                              />
                                            )}
                                            <div className="flex flex-col gap-2">
                                              <h2 className="text-sm font-medium text-white">
                                                {pm.name}
                                              </h2>
                                              {pm.description && (
                                                <p className="text-xs text-gray-400">{pm.description}</p>
                                              )}
                                            </div>
                                          </div>
                                          {selectedItemData && (() => {
                                            const baseAmount = baseAmountAfterCoupon;
                                            const pmTotal = calculateTotalWithFees(baseAmount, pm);
                                            return (
                                              <div className="text-right">
                                                <p className="font-medium text-white">
                                                  Rp {pmTotal.totalAmount.toLocaleString("id-ID")}
                                                </p>
                                                {(pmTotal.paymentFee > 0 || pmTotal.vatAmount > 0) && (
                                                  <p className="text-xs text-gray-400">
                                                    Termasuk biaya & PPN
                                                  </p>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>

                                        {isSelected && (
                                          <div className="mt-4 rounded-lg border border-primary/30 bg-[#2C3544] p-4">
                                            <h4 className="mb-4 text-sm font-semibold text-white">
                                              Informasi Kartu Kredit
                                            </h4>
                                            <div className="space-y-4">
                                              <div className="space-y-2">
                                                <Label htmlFor="cardNumber" className="text-sm text-gray-300">
                                                  Nomor Kartu <span className="text-red-400">*</span>
                                                </Label>
                                                <Input
                                                  id="cardNumber"
                                                  type="text"
                                                  placeholder="1234 5678 9012 3456"
                                                  value={creditCardData.cardNumber}
                                                  onChange={(e) => handleCardNumberChange(e.target.value)}
                                                  onBlur={() => {
                                                    const error = validateCardNumber(creditCardData.cardNumber);
                                                    setCreditCardErrors({ ...creditCardErrors, cardNumber: error });
                                                  }}
                                                  maxLength={19}
                                                  className={cn(
                                                    "bg-gray-800 text-white border-gray-700 placeholder:text-gray-500",
                                                    creditCardErrors.cardNumber && "border-red-500 focus-visible:ring-red-500"
                                                  )}
                                                />
                                                {creditCardErrors.cardNumber && (
                                                  <p className="text-xs text-red-400">{creditCardErrors.cardNumber}</p>
                                                )}
                                              </div>

                                              <div className="space-y-2">
                                                <Label htmlFor="cardholderName" className="text-sm text-gray-300">
                                                  Nama di Kartu <span className="text-red-400">*</span>
                                                </Label>
                                                <Input
                                                  id="cardholderName"
                                                  type="text"
                                                  placeholder="JOHN DOE"
                                                  value={creditCardData.cardholderName}
                                                  onChange={(e) => {
                                                    setCreditCardData({ ...creditCardData, cardholderName: e.target.value.toUpperCase() });
                                                    if (creditCardErrors.cardholderName) {
                                                      setCreditCardErrors({ ...creditCardErrors, cardholderName: undefined });
                                                    }
                                                  }}
                                                  onBlur={() => {
                                                    const error = !creditCardData.cardholderName.trim() ? "Cardholder name is required" : undefined;
                                                    setCreditCardErrors({ ...creditCardErrors, cardholderName: error });
                                                  }}
                                                  className={cn(
                                                    "bg-gray-800 text-white border-gray-700 placeholder:text-gray-500 uppercase",
                                                    creditCardErrors.cardholderName && "border-red-500 focus-visible:ring-red-500"
                                                  )}
                                                />
                                                {creditCardErrors.cardholderName && (
                                                  <p className="text-xs text-red-400">{creditCardErrors.cardholderName}</p>
                                                )}
                                              </div>

                                              <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                  <Label htmlFor="expiryDate" className="text-sm text-gray-300">
                                                    Tanggal Kadaluarsa <span className="text-red-400">*</span>
                                                  </Label>
                                                  <Input
                                                    id="expiryDate"
                                                    type="text"
                                                    placeholder="MM/YY"
                                                    value={creditCardData.expiryDate}
                                                    onChange={(e) => handleExpiryDateChange(e.target.value)}
                                                    onBlur={() => {
                                                      const error = validateExpiryDate(creditCardData.expiryDate);
                                                      setCreditCardErrors({ ...creditCardErrors, expiryDate: error });
                                                    }}
                                                    maxLength={5}
                                                    className={cn(
                                                      "bg-gray-800 text-white border-gray-700 placeholder:text-gray-500",
                                                      creditCardErrors.expiryDate && "border-red-500 focus-visible:ring-red-500"
                                                    )}
                                                  />
                                                  {creditCardErrors.expiryDate && (
                                                    <p className="text-xs text-red-400">{creditCardErrors.expiryDate}</p>
                                                  )}
                                                </div>

                                                <div className="space-y-2">
                                                  <Label htmlFor="cvv" className="text-sm text-gray-300">
                                                    CVV <span className="text-red-400">*</span>
                                                  </Label>
                                                  <Input
                                                    id="cvv"
                                                    type="text"
                                                    placeholder="123"
                                                    value={creditCardData.cvv}
                                                    onChange={(e) => handleCVVChange(e.target.value)}
                                                    onBlur={() => {
                                                      const error = validateCVV(creditCardData.cvv);
                                                      setCreditCardErrors({ ...creditCardErrors, cvv: error });
                                                    }}
                                                    maxLength={4}
                                                    className={cn(
                                                      "bg-gray-800 text-white border-gray-700 placeholder:text-gray-500",
                                                      creditCardErrors.cvv && "border-red-500 focus-visible:ring-red-500"
                                                    )}
                                                  />
                                                  {creditCardErrors.cvv && (
                                                    <p className="text-xs text-red-400">{creditCardErrors.cvv}</p>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="rounded-md bg-blue-500/10 p-3">
                                                <p className="flex items-start gap-2 text-xs text-blue-300">
                                                  <Image alt="" src={secure} className="mt-0.5 h-4 w-4" />
                                                  Informasi kartu Anda aman dan dienkripsi. Kami tidak menyimpan detail kartu Anda.
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </div>
                      )}

                      {/* Bank Transfer Group */}
                      {paymentMethods.filter((pm: any) => pm.type === "MOBILE_BANKING").length > 0 && (
                        <div className="overflow-hidden rounded-md bg-gray-800">
                          <AccordionItem value="bank-transfer" className="group border-none">
                            <AccordionTrigger className="group flex h-10 w-full items-center justify-between rounded-none border-none bg-black/40 px-6 py-4 hover:no-underline [&>svg]:hidden">
                              <span className="font-medium text-white uppercase tracking-wide">
                                🏦 Transfer Bank
                              </span>
                              <div className="flex items-center">
                                <ChevronDown className="h-5 w-5 text-white transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" />
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="bg-[#313C4C] p-4">
                              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {paymentMethods
                                  .filter((pm: any) => pm.type === "MOBILE_BANKING")
                                  .map((pm: any) => {
                                    const isSelected = selectedPaymentMethod === pm.id;
                                    return (
                                      <div
                                        key={pm.id}
                                        onClick={() => setSelectedPaymentMethod(pm.id)}
                                        className={cn(
                                          "rounded-lg bg-[#2C3544] p-4 transition-all duration-200 cursor-pointer flex flex-col items-center gap-3",
                                          isSelected ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary"
                                        )}
                                      >
                                        {pm.icon && (
                                          <Image
                                            src={pm.icon}
                                            alt={pm.name}
                                            width={80}
                                            height={48}
                                            className="rounded-md bg-white object-contain p-2"
                                          />
                                        )}
                                        <h3 className="font-medium text-white text-center text-sm">{pm.name}</h3>
                                        {pm.description && (
                                          <p className="text-xs text-gray-400 text-center">{pm.description}</p>
                                        )}
                                        {selectedItemData && (() => {
                                          const baseAmount = baseAmountAfterCoupon;
                                          const pmTotal = calculateTotalWithFees(baseAmount, pm);
                                          return (
                                            <div className="text-center w-full pt-2 border-t border-gray-600">
                                              <p className="text-sm font-medium text-white">
                                                Rp {pmTotal.totalAmount.toLocaleString("id-ID")}
                                              </p>
                                              {(pmTotal.paymentFee > 0 || pmTotal.vatAmount > 0) && (
                                                <p className="text-xs text-gray-400">
                                                  Termasuk biaya & PPN
                                                </p>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    );
                                  })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </div>
                      )}
                    </Accordion>
                    {/* Convenience Store Methods */}
                    {false && paymentMethods.filter((pm: any) => pm.type === "ECHANNEL").length > 0 && (
                      <div className="space-y-3">
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
                              <span className="font-medium text-white uppercase tracking-wide">
                                Toko Retail
                              </span>

                            <div className="flex items-center">
                              <ChevronDown className="h-5 w-5 text-white transition-transform duration-300 ease-out group-data-[state=open]:rotate-180" />
                            </div>
                          </AccordionTrigger>

                          <div className="flex justify-end gap-2 bg-[#313C4C] px-4 py-2 transition-all duration-200 ease-out group-data-[state=open]:hidden">
                            {paymentMethods
                              .filter((pm: any) => pm.type === "ECHANNEL")
                              .slice(0, 2)
                              .map((pm: any) => (
                                <Image
                                  key={pm.id}
                                  src={pm.icon || (pm.midtransCode === "indomaret" ? indomaret : alfamart)}
                                  alt={pm.name}
                                  width={48}
                                  height={48}
                                  className="w-12 rounded-sm bg-white p-1"
                                />
                              ))}
                          </div>

                          <AccordionContent className="bg-[#313C4C] p-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              {paymentMethods
                                .filter((pm: any) => pm.type === "ECHANNEL")
                                .map((pm: any) => {
                                  const isSelected = selectedPaymentMethod === pm.id;
                                  return (
                                    <div
                                      key={pm.id}
                                      onClick={() => setSelectedPaymentMethod(pm.id)}
                                      className={cn(
                                        "rounded-2xl bg-[#2C3544] p-4 transition-all duration-200 cursor-pointer",
                                        isSelected ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary"
                                      )}
                                    >
                                      <div className="flex items-center justify-start mb-2">
                                        <Image
                                          src={pm.icon || (pm.midtransCode === "indomaret" ? indomaret : alfamart)}
                                          alt={pm.name}
                                          width={100}
                                          height={56}
                                          className="rounded-md bg-white p-2"
                                        />
                                      </div>
                                      <h3 className="font-medium text-white mb-2">{pm.name}</h3>
                                      {selectedItemData && (() => {
                                        const baseAmount = baseAmountAfterCoupon;
                                        const pmTotal = calculateTotalWithFees(baseAmount, pm);
                                        return (
                                          <div>
                                            <p className="text-sm font-medium text-white">
                                              Rp {pmTotal.totalAmount.toLocaleString("id-ID")}
                                            </p>
                                            {(pmTotal.paymentFee > 0 || pmTotal.vatAmount > 0) && (
                                              <p className="text-xs text-gray-400">
                                                Termasuk biaya & PPN
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step 4: Masukkan Nomor WhatsApp */}
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

              {/* Step 5: Kode Promo */}
              <div className="overflow-hidden rounded-2xl bg-gray-800">
                {/* Header */}
                <div className="flex items-center gap-4 bg-black/40">
                  <div className="bg-primary flex h-10 w-10 items-center justify-center font-semibold text-white">
                    6
                  </div>
                  <h2 className="font-medium text-white">Kode Promo</h2>
                </div>
                {/* Form */}
                <div className="p-4">
                  <div className="flex flex-col">
                    <div className="mb-3 flex items-center gap-4">
                      <div className="flex-1">
                        <Input
                          placeholder="Ketik kode promo Kamu"
                          className="bg-foreground w-full border-0 p-5 text-white placeholder:text-gray-400"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value);
                            setCouponError(null);
                            if (appliedCoupon) {
                              setAppliedCoupon(null);
                            }
                          }}
                          disabled={validatingCoupon}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && couponCode.trim() && !validatingCoupon && selectedItemData) {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                        />
                        {couponError && (
                          <p className="mt-1 text-xs text-red-400">{couponError}</p>
                        )}
                        {appliedCoupon && (
                          <div className="mt-2 flex items-center gap-2 rounded-md bg-green-500/20 p-2">
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                            <p className="text-xs text-green-400">
                              Kode promo berhasil! Diskon: Rp {appliedCoupon.discountAmount.toLocaleString("id-ID")}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-auto h-6 w-6 p-0 text-red-400 hover:text-red-500"
                              onClick={() => {
                                setAppliedCoupon(null);
                                setCouponCode("");
                                setCouponError(null);
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <Button 
                        className="cursor-pointer"
                        disabled={validatingCoupon || !couponCode.trim() || !selectedItemData}
                        onClick={() => handleApplyCoupon()}
                      >
                        {validatingCoupon ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Memvalidasi...
                          </>
                        ) : (
                          "Gunakan"
                        )}
                      </Button>
                    </div>

                    {/* Button to open coupon modal */}
                    <Button 
                      className="mt-4 w-fit cursor-pointer"
                      onClick={() => setShowCouponModal(true)}
                    >
                      <p className="flex items-center gap-2">
                        <span>
                          <TicketPercent />
                        </span>
                        Lihat Promo yang Tersedia
                      </p>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Coupon Modal */}
              {isMounted && (
                <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
                  <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-gray-900 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-white">
                        Promo yang Tersedia
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                      {loadingCoupons ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : availableCoupons.length === 0 ? (
                        <div className="rounded-lg bg-gray-800/50 p-6 text-center text-sm text-gray-400">
                          Tidak ada promo yang tersedia saat ini
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {availableCoupons.map((coupon: any) => {
                            const isApplicable = applicableCouponIds.includes(coupon.id);
                            const isApplied = appliedCoupon?.code === coupon.code;
                            const discountText =
                              coupon.discountType === "PERCENTAGE"
                                ? `${coupon.discountValue}%`
                                : `Rp ${coupon.discountValue.toLocaleString("id-ID")}`;
                            
                            // Calculate potential discount for display
                            let potentialDiscount = 0;
                            if (selectedItemData) {
                              const baseAmount = productPrice * quantity;
                              if (coupon.discountType === "PERCENTAGE") {
                                potentialDiscount = Math.round((baseAmount * coupon.discountValue) / 100);
                                if (coupon.maxDiscount && potentialDiscount > coupon.maxDiscount) {
                                  potentialDiscount = coupon.maxDiscount;
                                }
                              } else {
                                potentialDiscount = coupon.discountValue;
                              }
                              potentialDiscount = Math.min(potentialDiscount, baseAmount);
                            }

                            return (
                              <div
                                key={coupon.id}
                                onClick={() => {
                                  if (isApplicable && !isApplied && selectedItemData) {
                                    handleApplyCoupon(coupon.code);
                                    setShowCouponModal(false);
                                  }
                                }}
                                className={cn(
                                  "relative cursor-pointer rounded-lg border-2 p-4 transition-all",
                                  isApplied
                                    ? "border-green-500 bg-green-500/10"
                                    : isApplicable
                                    ? "border-primary/50 bg-primary/5 hover:border-primary hover:bg-primary/10"
                                    : "border-gray-600 bg-gray-800/50 opacity-60 cursor-not-allowed"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-white">
                                        {coupon.code}
                                      </p>
                                      {isApplied && (
                                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                                      )}
                                    </div>
                                    {coupon.description && (
                                      <p className="mt-1 text-sm text-gray-300">
                                        {coupon.description}
                                      </p>
                                    )}
                                    <div className="mt-3 flex flex-col gap-2">
                                      <div className="flex items-center gap-4 text-sm">
                                        <span className="font-semibold text-primary">
                                          Diskon {discountText}
                                        </span>
                                        {selectedItemData && potentialDiscount > 0 && (
                                          <span className="text-gray-400">
                                            Hemat Rp {potentialDiscount.toLocaleString("id-ID")}
                                          </span>
                                        )}
                                      </div>
                                      {coupon.minPurchase && (
                                        <p className="text-xs text-gray-500">
                                          Min. belanja: Rp {coupon.minPurchase.toLocaleString("id-ID")}
                                        </p>
                                      )}
                                      {coupon.maxDiscount && coupon.discountType === "PERCENTAGE" && (
                                        <p className="text-xs text-gray-500">
                                          Maks. diskon: Rp {coupon.maxDiscount.toLocaleString("id-ID")}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {!isApplicable && (
                                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
                                    <p className="text-xs font-medium text-gray-300">
                                      {productPrice * quantity < (coupon.minPurchase || 0)
                                        ? `Min. belanja Rp ${coupon.minPurchase?.toLocaleString("id-ID")}`
                                        : "Tidak dapat digunakan"}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* KONTEN KANAN */}
          <div>
            <div className="sticky h-fit top-36 w-full">
              <div className="flex flex-col gap-4">
                <Card className="overflow-hidden border-0 bg-gray-800 py-0">
                  <CardContent className="p-0">
                    <CardTitle className="p-0">
                      <div className="flex items-center gap-4 bg-black/40">
                        <div className="flex h-10 items-center p-4">
                          <h2 className="font-medium text-white">
                            Ulasan dan rating
                          </h2>
                        </div>
                      </div>
                    </CardTitle>

                    <div className="flex items-center gap-6 p-4">
                      {(() => {
                        const avgRating = productRatings?.averageRating || 0;
                        const totalRatings = productRatings?.totalRatings || 0;
                        const formattedTotal = totalRatings >= 1000000
                          ? `${(totalRatings / 1000000).toFixed(2)}jt`
                          : totalRatings >= 1000
                          ? `${(totalRatings / 1000).toFixed(1)}rb`
                          : totalRatings.toString();
                        
                        return (
                          <>
                            <h1 className="text-5xl font-semibold text-white">
                              {avgRating.toFixed(2)}<span className="text-xl">/5</span>
                            </h1>
                            <div>
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon key={i} />
                                ))}
                              </div>
                              <p className="mt-2 text-sm text-white">
                                Berdasarkan total {formattedTotal} rating
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 bg-gray-800 py-0">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-6 p-4">
                      <div className="flex items-center gap-4">
                        <Headset className="size-8 text-white" />
                        <div>
                          <h1 className="text-semibold text-white">
                            Butuh Bantuan?
                          </h1>
                          <p className="text-sm font-light text-white">
                            Kamu bisa hubungi admin disini.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 bg-black/80 py-0">
                  <CardContent className="space-y-4 p-4">
                    {!selectedItemData ? (
                      <div className="flex h-40 items-center justify-center text-center text-sm text-white">
                        Belum ada item produk yang dipilih
                      </div>
                    ) : (
                      <>
                        {/* Product Info */}
                        <div className="flex gap-4">
                          <Image
                            src={product.image}
                            alt={
                              (product as any).name || (product as any).title
                            }
                            width={64}
                            height={64}
                            className="rounded-md object-cover"
                          />
                          <div className="flex flex-col">
                            <p className="text-sm font-semibold text-white">
                              {(product as any).name || (product as any).title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {selectedItemData.name}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-white/10" />

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-gray-300">
                            <span>Harga</span>
                            <span>
                              Rp {productPrice.toLocaleString("id-ID")}
                            </span>
                          </div>

                          <div className="flex justify-between text-gray-300">
                            <span>Jumlah</span>
                            <span>{quantity}</span>
                          </div>

                          {couponDiscount > 0 && (
                            <div className="flex justify-between text-green-400">
                              <span className="flex items-center gap-1">
                                <TicketPercent className="h-3 w-3" />
                                Diskon Promo ({appliedCoupon?.code})
                              </span>
                              <span>- Rp {couponDiscount.toLocaleString("id-ID")}</span>
                            </div>
                          )}

                          {paymentFee > 0 && (
                            <div className="flex justify-between text-gray-300">
                              <span>Biaya Layanan</span>
                              <span>Rp {paymentFee.toLocaleString("id-ID")}</span>
                            </div>
                          )}
                          {vatAmount > 0 && (
                            <div className="flex justify-between text-gray-300">
                              <span>PPN</span>
                              <span>Rp {vatAmount.toLocaleString("id-ID")}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-gray-300">
                            <span className="flex items-center gap-2">
                              <Image alt="" src={lightning} className="w-4" />
                              Pengiriman Instan
                            </span>
                            <span className="text-green-400">✓</span>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-white/20" />

                        <div className="flex justify-between text-base font-semibold text-white">
                          <span>Total Pembayaran</span>
                          <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {isMounted ? (
                  <Dialog open={openConfirm} onOpenChange={setOpenConfirm}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-primary w-full cursor-pointer py-6 text-lg font-medium"
                        disabled={!selectedItemData || !selectedPaymentMethod}
                      >
                        Bayar Sekarang
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="bg-foreground max-w-md rounded-2xl border-0 text-white">
                    <DialogHeader className="text-center">
                      <div className="mx-auto -mt-10 -mb-16 flex h-72 w-72 items-center justify-center">
                        <Lottie
                          animationData={animationData}
                          loop={false}
                          autoplay
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <DialogTitle className="mb-2 text-xl">
                          Buat Pesanan
                        </DialogTitle>
                        <p className="text-sm text-gray-400">
                          Pastikan data akun Kamu dan produk yang Kamu pilih
                          valid dan sesuai.
                        </p>
                      </div>
                    </DialogHeader>

                    {/* DETAIL PESANAN */}
                    <div className="bg-card mt-4 space-y-3 rounded-xl p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Username</span>
                        <span>{/* ambil dari input */}-</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Item</span>
                        <span>{selectedItemData?.name}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Product</span>
                        <span>
                          {productData?.name || (product as any).title}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Jumlah</span>
                        <span>{quantity}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Metode Pembayaran</span>
                        <span>{selectedPaymentMethodData?.name || "-"}</span>
                      </div>

                      {appliedCoupon && (
                        <div className="flex justify-between text-green-400">
                          <span className="text-gray-400">Kode Promo</span>
                          <span>{appliedCoupon.code}</span>
                        </div>
                      )}

                      <div className="flex justify-between border-t border-white/10 pt-3 font-semibold">
                        <span>Total</span>
                        <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        id="agree"
                        checked={isAgree}
                        onChange={(e) => setIsAgree(e.target.checked)}
                        className="accent-primary mt-1 h-4 w-4 rounded border-white/30"
                      />
                      <label
                        htmlFor="agree"
                        className="leading-snug text-gray-400"
                      >
                        Saya menyetujui{" "}
                        <span className="text-primary cursor-pointer">
                          <Link href={"/termsconditions"}>
                            syarat & ketentuan
                          </Link>
                        </span>{" "}
                        dan memastikan data pesanan sudah benar.
                      </label>
                    </div>

                    {/* FOOTER */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <Button
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setOpenConfirm(false)}
                      >
                        Batalkan
                      </Button>

                      <Button
                        className="bg-primary cursor-pointer"
                        disabled={!isAgree || isLoading || !selectedItemData || !selectedPaymentMethod || (isMobileLegends && !isVerified)}
                        onClick={async () => {
                          if (!selectedItemData || !selectedPaymentMethod) return;

                          // Validate Mobile Legends account verification
                          if (isMobileLegends && !isVerified) {
                            toast.error("Verifikasi Akun Diperlukan", {
                              description: "Silakan verifikasi akun Mobile Legends Anda terlebih dahulu sebelum membuat pesanan.",
                            });
                            return;
                          }

                          // Validate credit card if credit card payment method is selected
                          const selectedPM = paymentMethods.find((pm: any) => pm.id === selectedPaymentMethod);
                          if (selectedPM?.type === "CREDIT_CARD") {
                            const errors: typeof creditCardErrors = {};
                            errors.cardNumber = validateCardNumber(creditCardData.cardNumber);
                            errors.cardholderName = !creditCardData.cardholderName.trim() ? "Cardholder name is required" : undefined;
                            errors.expiryDate = validateExpiryDate(creditCardData.expiryDate);
                            errors.cvv = validateCVV(creditCardData.cvv);
                            
                            setCreditCardErrors(errors);
                            
                            if (errors.cardNumber || errors.cardholderName || errors.expiryDate || errors.cvv) {
                              toast.error("Please fill in all credit card details correctly");
                              return;
                            }
                          }

                          setIsLoading(true);
                          setOpenConfirm(false);

                          try {
                            // Prepare customer data
                            const customerData: any = {};
                            (product?.inputFields || []).forEach((field) => {
                              if (field.name === "userId") {
                                customerData.userId = userId;
                              } else if (field.name === "serverId") {
                                customerData.serverId = serverId;
                              } else if (field.name === "zoneId") {
                                customerData.zoneId = zoneId;
                              }
                            });
                            if (phone) {
                              customerData.phone = phone;
                            }

                            // Create payment
                            const response = await fetch("/api/payments/create", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                productItemId: selectedItemData.id,
                                customerData,
                                couponCode: appliedCoupon?.code || null,
                                paymentMethodId: selectedPaymentMethod,
                              }),
                            });

                            const data = await response.json();

                            if (!response.ok) {
                              console.error("Payment creation failed:", data);
                              toast.error("Gagal membuat pesanan", {
                                description: data.message || `Error ${response.status}: ${response.statusText}`,
                              });
                              setIsLoading(false);
                              return;
                            }

                            if (data.success) {
                              // Redirect to payment page with order ID
                              router.push(`/payment?orderId=${data.data.orderId}`);
                            } else {
                              toast.error("Gagal membuat pesanan", {
                                description: data.message || "Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.",
                              });
                              setIsLoading(false);
                            }
                          } catch (error) {
                            console.error("Payment creation error:", error);
                            toast.error("Terjadi kesalahan", {
                              description: error instanceof Error ? error.message : "Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.",
                            });
                            setIsLoading(false);
                          }
                        }}
                      >
                        {isLoading ? "Memproses..." : "Pesan Sekarang"}
                      </Button>
                    </div>
                  </DialogContent>
                  </Dialog>
                ) : (
                  <Button
                    className="bg-primary w-full cursor-pointer py-6 text-lg font-medium"
                    disabled={!selectedItemData || !selectedPaymentMethod}
                    onClick={() => setIsMounted(true)}
                  >
                    Bayar Sekarang
                  </Button>
                )}
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/70 backdrop-blur">
              <div className="flex flex-col items-center gap-3">
                {/* spinner simple (tanpa lottie) */}
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                <p className="text-sm text-gray-300">
                  Mengarahkan ke pembayaran...
                </p>
              </div>
            </div>
          )}
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
