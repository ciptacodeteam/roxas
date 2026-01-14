import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";

/**
 * GET /api/products
 * Fetch all active products from database
 * Query params:
 *   - category: filter by category slug or name
 *   - limit: limit number of results
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const categoryName = searchParams.get("categoryName");
    const limit = searchParams.get("limit");

    // Build where clause
    const where: {
      isActive: boolean;
      category?: {
        slug?: string;
        name?: string;
      };
    } = {
      isActive: true,
    };

    // Filter by category if provided (prioritize slug over name)
    if (categorySlug) {
      where.category = { slug: categorySlug };
    } else if (categoryName) {
      where.category = { name: categoryName };
    }

    // Fetch products with their items to check for MLCU SKU codes
    const products = await db.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        items: {
          select: {
            skuCode: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
      take: limit ? parseInt(limit, 10) : undefined,
    });

    // Transform to match frontend expectations and filter out "cek username" products
    // Hide products that have items with SKU codes starting with "MLCU"
    const transformedProducts = products
      .filter((product) => {
        // Check if any product item has SKU code starting with "MLCU"
        const hasMLCUSku = product.items.some((item) => 
          item.skuCode && item.skuCode.toUpperCase().startsWith("MLCU")
        );
        return !hasMLCUSku;
      })
      .map((product) => ({
        id: product.id,
        title: product.name,
        subtitle: product.category.name,
        image: product.image || "/img/ffcover.webp", // fallback image
        slug: product.slug,
        description: product.description,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        },
      }));

    return NextResponse.json({
      success: true,
      data: transformedProducts,
    });
  } catch (error) {
    console.error("Get products error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to get products",
      },
      { status: 500 }
    );
  }
}

