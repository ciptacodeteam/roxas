import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { createDigiflazzTopup, type DigiflazzTopupResponse } from "@/lib/digiflazz";

/**
 * POST /api/products/verify-ml-account
 * Verify Mobile Legends account by checking if user ID and server ID are valid
 * This uses Digiflazz API "cek username" (MLCU SKU) to check account validity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, serverId } = body;

    if (!userId || !serverId) {
      return NextResponse.json(
        {
          success: false,
          message: "User ID and Server ID are required",
        },
        { status: 400 }
      );
    }

    // Validate format (User ID should be numeric, Server ID should be numeric)
    if (!/^\d+$/.test(userId.toString()) || !/^\d+$/.test(serverId.toString())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid format. User ID and Server ID must be numbers",
        },
        { status: 400 }
      );
    }

    // Find MLCU (cek username) product item from database
    // Try by SKU code first, then by name pattern
    let mlcuItem = await db.productItem.findFirst({
      where: {
        skuCode: {
          startsWith: "MLCU",
          mode: "insensitive",
        },
        isActive: true,
      },
      select: {
        skuCode: true,
      },
    });

    // If not found by SKU, try to find by name pattern
    if (!mlcuItem) {
      mlcuItem = await db.productItem.findFirst({
        where: {
          name: {
            contains: "cek username",
            mode: "insensitive",
          },
          isActive: true,
        },
        select: {
          skuCode: true,
        },
      });
    }

    if (!mlcuItem || !mlcuItem.skuCode) {
      // If no MLCU item found, fall back to basic validation
      console.warn("[ML Verify] No MLCU product item found, using basic validation");
      return NextResponse.json({
        success: true,
        data: {
          userId: userId.toString(),
          serverId: serverId.toString(),
          verified: true,
          message: "Account format validated (MLCU product not available)",
        },
      });
    }

    // Call Digiflazz API with MLCU SKU code to verify the account
    // Format: userId + serverId (e.g., "123456789|1234")
    const customerNo = `${userId}${serverId}`;
    const refId = `ML_VERIFY_${Date.now()}_${userId}`;

    try {
      const result: DigiflazzTopupResponse = await createDigiflazzTopup({
        skuCode: mlcuItem.skuCode!,
        customerNo: customerNo,
        refId: refId,
        testing: true, // Always use testing mode for verification
      });

      // Check if verification was successful
      // Digiflazz returns the username in the message or sn field for successful verification
      if (result.status === "Sukses" || result.status === "Pending") {
        // Extract username from response (usually in sn or message field)
        const username = result.sn || result.message;
        
        return NextResponse.json({
          success: true,
          data: {
            userId: userId.toString(),
            serverId: serverId.toString(),
            verified: true,
            username: username,
            message: result.message || "Account verified successfully",
          },
        });
      } else {
        // Verification failed
        return NextResponse.json({
          success: false,
          message: result.message || "Account verification failed. Please check your User ID and Server ID.",
          data: {
            verified: false,
            responseCode: result.rc,
          },
        });
      }
    } catch (apiError) {
      console.error("[ML Verify] Digiflazz API error:", apiError);
      
      // If API call fails, return error
      return NextResponse.json(
        {
          success: false,
          message: apiError instanceof Error 
            ? `Verification failed: ${apiError.message}` 
            : "Failed to verify account. Please try again later.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Verify ML account error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to verify account",
      },
      { status: 500 }
    );
  }
}

