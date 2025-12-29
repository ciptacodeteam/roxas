import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { put } from "@vercel/blob";
import { env } from "@/env";
import { compressToWebP } from "@/lib/image-compression";

/**
 * POST /api/admin/upload
 * Upload image file to Vercel Blob storage with WebP compression
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "No file provided",
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid file type. Only images are allowed.",
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB before compression - will be compressed to <4.5MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: "File size too large. Maximum size is 10MB before compression.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Compress and convert to WebP
    const compressedBuffer = await compressToWebP(buffer);

    // Validate compressed size (should be <4.5MB, but double-check)
    if (compressedBuffer.length > 4.5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: "Image is too large even after compression. Please use a smaller image.",
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${originalName.replace(/\.[^/.]+$/, "")}.webp`;

    // Get directory type from query params (defaults to 'products')
    const url = new URL(request.url);
    const type = url.searchParams.get("type") || "products";

    // Upload to Vercel Blob
    const blob = await put(`${type}/${filename}`, compressedBuffer, {
      access: "public",
      token: env.BLOB_READ_WRITE_TOKEN,
      contentType: "image/webp",
    });

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        filename: filename,
        size: compressedBuffer.length,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 }
    );
  }
}
