import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/server/db";

/**
 * GET /api/admin/products
 * Fetch all products with their categories
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const products = await db.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: products,
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

/**
 * POST /api/admin/products
 * Create a new product
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { name, slug, description, categoryId, image, bannerImage, isActive, sortOrder, inputFields } = body;

    if (!name || !slug || !categoryId) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, slug, and categoryId are required",
        },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name,
        slug,
        description: description || null,
        image: image || null,
        bannerImage: bannerImage || null,
        categoryId,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        inputFields: inputFields || [],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create product",
      },
      { status: 500 }
    );
  }
}
