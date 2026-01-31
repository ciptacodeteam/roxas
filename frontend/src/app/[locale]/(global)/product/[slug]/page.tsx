/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import ProductDetailClient from "./ProductDetailClient";
import { getActiveProductBySlug } from "@/lib/products/api";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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
        // If field is already an object with name property, use it directly
        if (typeof field === 'object' && field !== null && field.name) {
          return {
            name: field.name,
            label: field.label || field.name,
            required: field.required !== false,
            dialog: field.dialog,
          };
        }
        // If field is a string, convert to object
        if (typeof field === 'string') {
          return {
            name: field,
            label:
              field === "userId"
                ? "User ID"
                : field === "serverId" || field === "zoneId"
                  ? "Server ID"
                  : field === "phoneNumber"
                    ? "Nomor Telepon"
                    : field,
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
          sku_code: item.sku_code,
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

  return <ProductDetailClient slug={slug} productData={productData} />;
}
