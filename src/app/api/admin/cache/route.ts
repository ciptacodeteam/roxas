import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { apiCache } from "@/lib/api-cache";
import { rateLimiter } from "@/lib/rate-limiter";
import { getDigiflazzRateLimitKey } from "@/lib/sync-config";

/**
 * GET /api/admin/cache
 * Get cache and rate limit status
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const cacheStats = apiCache.stats();
    const rateLimitStatus = rateLimiter.status(getDigiflazzRateLimitKey("price-list"));

    return NextResponse.json({
      success: true,
      cache: cacheStats,
      rateLimit: {
        ...rateLimitStatus,
        lastCallTime: rateLimitStatus.lastCall 
          ? new Date(rateLimitStatus.lastCall).toISOString() 
          : null,
      },
    });
  } catch (error) {
    console.error("Cache status error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to get cache status",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/cache
 * Clear cache and/or rate limits
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const clearCache = searchParams.get("cache") !== "false"; // Default true
    const clearRateLimit = searchParams.get("rateLimit") === "true"; // Default false

    let message = "";

    if (clearCache) {
      apiCache.clear();
      message += "Cache cleared. ";
    }

    if (clearRateLimit) {
      rateLimiter.clear();
      message += "Rate limits cleared. ";
    }

    if (!clearCache && !clearRateLimit) {
      message = "No action taken. Use ?cache=true or ?rateLimit=true";
    }

    return NextResponse.json({
      success: true,
      message: message.trim(),
      cache: apiCache.stats(),
      rateLimit: rateLimiter.status(getDigiflazzRateLimitKey("price-list")),
    });
  } catch (error) {
    console.error("Cache clear error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to clear cache",
      },
      { status: 500 }
    );
  }
}

