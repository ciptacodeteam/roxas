/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import ProductDetailClient from "./ProductDetailClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getProductBySlug(slug: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/products/${slug}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);

  // Transform API response to match expected format
  let productData: any = undefined;
  if (product) {
    productData = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      image: product.image || "/img/ffcover.webp",
      bannerImage: product.banner_image,
      canvas: product.banner_image || "/img/img-2.webp",
      inputFields: Array.isArray(product.input_fields)
        ? product.input_fields
          .filter((field): field is string => typeof field === "string")
          .map((field) => ({
            name: field,
            label:
              field === "userId"
                ? "ID"
                : field === "serverId" || field === "zoneId"
                  ? "Server"
                  : field === "phoneNumber"
                    ? "Nomor Telepon"
                    : field,
            required: true,
            ...(field === "userId" && {
              dialog: {
                title: "Cara Menemukan User ID",
                content:
                  "Buka game → klik avatar → salin User ID di profile.",
              },
            }),
          }))
        : [],
      items: (product.items || [])
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          iconImage: item.icon_image,
          price: item.sell_price,
          basePrice: item.base_price,
          normalPrice: item.normal_price,
          discountedPrice: item.discounted_price,
          skuCode: item.sku_code,
          group: item.group,
        }))
        .sort((a: any, b: any) => a.price - b.price),
      instructionImages: (product.category?.instruction_images || []).map((img: any) => ({
        id: img.id,
        imageUrl: img.image_url,
        altText: img.alt_text,
      })),
    };
  }

  return <ProductDetailClient slug={slug} productData={productData} />;
}
