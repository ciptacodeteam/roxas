import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/server/db";
import { createDigiflazzTopup, type DigiflazzTopupResponse } from "@/lib/digiflazz";

/**
 * POST /api/products/verify-ml-account
 * Verify Mobile Legends account by checking if user ID and server ID are valid
 * This uses Digiflazz API "cek username" (MLCU SKU) to check account validity
 * 
 * For Prepaid transactions, status check is done by re-sending the same request
 * with the same ref_id (as per Digiflazz docs)
 */

// Helper function to poll for transaction status
async function pollForStatus(
  skuCode: string,
  customerNo: string,
  refId: string,
  maxAttempts: number = 5,
  delayMs: number = 2000
): Promise<DigiflazzTopupResponse> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Wait before polling (skip first attempt)
    if (attempt > 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    console.log(`[ML Verify] Polling attempt ${attempt}/${maxAttempts} for refId: ${refId}`);
    
    try {
      // For prepaid, check status by re-sending with same ref_id
      const result = await createDigiflazzTopup({
        skuCode: skuCode,
        customerNo: customerNo,
        refId: refId,
        // Don't use testing mode for real verification
      });

      // If status is no longer Pending, return result
      if (result.status !== "Pending") {
        console.log(`[ML Verify] Got final status: ${result.status}`);
        return result;
      }

      console.log(`[ML Verify] Still Pending, will retry...`);
    } catch (error) {
      console.error(`[ML Verify] Polling error on attempt ${attempt}:`, error);
      // Continue polling on error (might be temporary)
    }
  }

  // Return last known result (Pending)
  throw new Error("Verification timeout - please try again later");
}
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
      // NOTE: MLCU (cek username) requires real API call without testing mode
      // This uses Digiflazz balance but is typically a low-cost verification
      let result: DigiflazzTopupResponse = await createDigiflazzTopup({
        skuCode: mlcuItem.skuCode!,
        customerNo: customerNo,
        refId: refId,
        // Don't use testing mode for MLCU - it needs real API to get username
      });

      // If status is Pending, poll for final status
      if (result.status === "Pending") {
        console.log("[ML Verify] Got Pending status, polling for final result...");
        try {
          result = await pollForStatus(
            mlcuItem.skuCode!,
            customerNo,
            refId,
            5,  // max 5 attempts
            2000 // 2 second delay between attempts
          );
        } catch (pollError) {
          console.error("[ML Verify] Polling failed:", pollError);
          // Continue with Pending result - might still have username
        }
      }

      // Check if verification was successful
      // Digiflazz returns the username in the message or sn field for successful verification
      if (result.status === "Sukses") {
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
      } else if (result.status === "Pending") {
        // Still pending after polling - let user know to try again
        return NextResponse.json({
          success: false,
          message: "Verification is still processing. Please try again in a few moments.",
          data: {
            verified: false,
            status: "pending",
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

