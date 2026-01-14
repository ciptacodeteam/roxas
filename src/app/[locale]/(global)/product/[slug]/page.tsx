/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import ProductDetailClient from "./ProductDetailClient";
import { db } from "@/server/db";
import { ensurePricesSynced } from "@/lib/ensure-prices-synced";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Ensure prices are synced before fetching
  await ensurePricesSynced();

  // Try to find product by slug, with fallback to alternative slug formats
  // Database might have "mobile-legends-games" but URL might be "mobile-legends-bang-bang"
  let product = await db.product.findUnique({
    where: { slug },
    include: {
      category: {
        include: {
          instructionImages: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
      items: {
        where: {
          isActive: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  // If not found, try alternative slug formats
  if (!product) {
    // Try removing "-bang-bang" suffix and adding category
    const slugWithoutSuffix = slug.replace(/-bang-bang$/, "");
    const possibleSlugs = [
      `${slugWithoutSuffix}-games`, // mobile-legends-games
      slugWithoutSuffix, // mobile-legends
    ];

    for (const altSlug of possibleSlugs) {
      product = await db.product.findUnique({
        where: { slug: altSlug },
        include: {
          category: {
            include: {
              instructionImages: {
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
          items: {
            where: {
              isActive: true,
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });
      if (product) break;
    }
  }

  // Fallback to hardcoded data if product not found in database
  // This allows gradual migration
  let productData = null;
  if (product) {
    productData = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      image: product.image || "/img/ffcover.webp",
      bannerImage: product.bannerImage,
      canvas: product.bannerImage || "/img/img-2.webp",
      inputFields: Array.isArray(product.inputFields)
        ? product.inputFields
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
      items: product.items
        .map((item) => ({
          id: item.id,
          name: item.name,
          iconImage: item.iconImage,
          price: item.sellPrice,
          basePrice: item.basePrice,
          normalPrice: item.normalPrice,
          discountedPrice: item.discountedPrice,
          skuCode: item.skuCode,
        }))
        .sort((a, b) => a.price - b.price), // Sort by price ascending
      instructionImages: product.category.instructionImages.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        altText: img.altText,
      })),
    };
  }

  return <ProductDetailClient slug={slug} productData={productData} />;
}
