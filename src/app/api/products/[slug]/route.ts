import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { ensurePricesSynced } from "@/lib/ensure-prices-synced";

/**
 * GET /api/products/[slug]
 * Fetch product and its items by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Ensure prices are synced before fetching
    await ensurePricesSynced();

    // Fetch product with its items
    const product = await db.product.findUnique({
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

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        image: product.image,
        bannerImage: product.bannerImage,
        inputFields: product.inputFields,
        instructions: product.instructions,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        },
        instructionImages: product.category.instructionImages || [],
        items: product.items.map((item) => ({
          id: item.id,
          name: item.name,
          skuCode: item.skuCode,
          iconImage: item.iconImage,
          basePrice: item.basePrice,
          normalPrice: item.normalPrice,
          discountedPrice: item.discountedPrice,
          sellPrice: item.sellPrice,
          sortOrder: item.sortOrder,
        })),
      },
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get product",
      },
      { status: 500 }
    );
  }
}

