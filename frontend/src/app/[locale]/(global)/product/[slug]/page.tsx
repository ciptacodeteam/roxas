import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";
import { getActiveProductBySlug } from "@/lib/products/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://roxasgamestore.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getActiveProductBySlug(slug);
    const title = product?.name ?? "Top Up Game";
    const description =
      product?.description ||
      `Top up ${product?.name ?? "game"} dengan harga terbaik, proses instan, dan pembayaran lengkap di Roxas Games Store.`;
    const image = product?.image ? `${SITE_URL}${product.image.startsWith("http") ? "" : ""}${product.image}` : `${SITE_URL}/img/og-default.webp`;

    return {
      title,
      description,
      openGraph: {
        title: `${title} | Roxas Games Store`,
        description,
        images: [{ url: image, width: 1200, height: 630, alt: title }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | Roxas Games Store`,
        description,
        images: [image],
      },
      alternates: {
        canonical: `${SITE_URL}/id/product/${slug}`,
      },
    };
  } catch {
    return {
      title: "Top Up Game",
      description: "Top up game dengan harga terbaik di Roxas Games Store.",
    };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;

  let product: any = null;
  try {
    product = await getActiveProductBySlug(slug);
  } catch (error) {
    console.error("Failed to fetch product:", error);
  }

  // Transform API response to match expected format
  let productData: any = undefined;
  if (product) {
    // Handle input_fields - can be array of strings OR array of objects
    let inputFields: any[] = [];
    if (Array.isArray(product.input_fields)) {
      inputFields = product.input_fields.map((field: any) => {
        // If field is already an object with key property, use it directly
        if (typeof field === 'object' && field !== null && (field.key || field.name)) {
          return {
            key: field.key || field.name, // support legacy `name` from old data
            label: field.label || field.key || field.name,
            type: field.type || "text",
            placeholder: field.placeholder,
            hint: field.hint,
            required: field.required !== false,
            dialog: field.dialog,
          };
        }
        // If field is a string, convert to object
        if (typeof field === 'string') {
          return {
            key: field,
            label:
              field === "userId"
                ? "User ID"
                : field === "serverId" || field === "zoneId"
                  ? "Server ID"
                  : field === "phoneNumber"
                    ? "Nomor Telepon"
                    : field,
            type: field === "phoneNumber" ? "tel" : "text",
            required: true,
            ...(field === "userId" && {
              dialog: {
                title: "Cara Menemukan User ID",
                content: "Buka game → klik avatar → salin User ID di profile.",
              },
            }),
          };
        }
        return null;
      }).filter(Boolean);
    }

    productData = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      image: product.image || "/img/ffcover.webp",
      banner_image: product.banner_image,
      inputFields: inputFields,
      supports_validation: product.supports_validation || false,
      items: (product.items || [])
        .filter((item: any) => item.is_active)
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          icon_image: item.icon_image,
          price: item.sell_price,
          base_price: item.base_price,
          normal_price: item.normal_price,
          discounted_price: item.discounted_price,
          group: item.group,
        }))
        .sort((a: any, b: any) => a.price - b.price),
      instruction_images: (product.category_details?.instruction_images || []).map((img: any) => ({
        id: img.id,
        image: img.image,
        alt_text: img.alt_text,
      })),
    };
  }

  return <ProductDetailClient slug={slug} locale={locale} productData={productData} />;
}
