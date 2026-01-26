import crypto from "crypto";
import { env } from "@/env";
import { apiCache } from "./api-cache";
import { rateLimiter } from "./rate-limiter";
import {
  getSyncConfig,
  getPriceListCacheKey,
  getDigiflazzRateLimitKey
} from "./sync-config";
import { getMockPriceList } from "./mock-data";
import { logApiCall } from "./api-logger";
import { ApiProvider, ApiLogStatus } from "@prisma/client";

/**
 * Generate signature for Digiflazz API requests
 * Different endpoints use different signature formulas:
 * - Price list: md5(username + apiKey + "pricelist")
 * - Transactions: md5(username + apiKey + ref_id)
 */
export function generateDigiflazzSignature(refId: string): string {
  const signatureString = `${env.DIGIFLAZZ_USERNAME}${env.DIGIFLAZZ_API_KEY}${refId}`;
  return crypto.createHash("md5").update(signatureString).digest("hex");
}

/**
 * Generate signature specifically for price list endpoint
 * According to Digiflazz docs: sign = md5(username + apiKey + "pricelist")
 */
export function generatePriceListSignature(): string {
  const signatureString = `${env.DIGIFLAZZ_USERNAME}${env.DIGIFLAZZ_API_KEY}pricelist`;
  return crypto.createHash("md5").update(signatureString).digest("hex");
}

/**
 * Fetch price list from Digiflazz API with caching and rate limiting
 * According to Digiflazz documentation: https://developer.digiflazz.com/
 * 
 * Features:
 * - Response caching to reduce API calls
 * - Rate limiting to respect API limits
 * - Automatic retry with exponential backoff
 * - Environment-aware configuration
 */
export async function getDigiflazzPriceList(
  cmd: "prepaid" | "pasca" = "prepaid",
  options: {
    skipCache?: boolean;
    skipRateLimit?: boolean;
  } = {}
) {
  const config = getSyncConfig();

  // Use mock data in development if configured
  if (config.useMockData) {
    console.log(`[Digiflazz] Using mock data (useMockData: true in config)`);
    return getMockPriceList(cmd);
  }

  const cacheKey = getPriceListCacheKey(cmd);
  const rateLimitKey = getDigiflazzRateLimitKey("price-list");

  // Check cache first (unless skipCache is true)
  if (!options.skipCache) {
    const cached = apiCache.get(cacheKey);
    if (cached) {
      if (config.logDebugInfo) {
        console.log(`[Digiflazz] Using cached price list for ${cmd}`);
      }
      return cached;
    }
  }

  // Check rate limit
  if (config.enableRateLimit && !options.skipRateLimit) {
    const { allowed, waitMs } = rateLimiter.check(rateLimitKey, config.rateLimit);

    if (!allowed) {
      const waitMinutes = Math.ceil(waitMs / 60000);
      const message = `Rate limit reached. Please wait ${waitMinutes} minute(s) before syncing again. Consider using cached data.`;

      console.warn(`[Digiflazz] ${message}`);

      // In development, throw a helpful error
      if (config.logDebugInfo) {
        throw new Error(message);
      }

      // In production, wait automatically
      console.log(`[Digiflazz] Waiting ${waitMs}ms before making API call...`);
      await rateLimiter.wait(waitMs);
    }
  }

  try {
    // Use the price list specific signature (md5(username + apiKey + "pricelist"))
    const sign = generatePriceListSignature();

    if (config.logDebugInfo) {
      console.log(`[Digiflazz] Fetching price list for ${cmd}...`);
    }

    const startTime = Date.now();
    const response = await fetch(`${env.DIGIFLAZZ_API_URL}/price-list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cmd: cmd,
        username: env.DIGIFLAZZ_USERNAME,
        sign: sign,
      }),
    });
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      // Log failed API call
      await logApiCall({
        provider: ApiProvider.DIGIFLAZZ,
        endpoint: "/price-list",
        method: "POST",
        requestData: { cmd, username: env.DIGIFLAZZ_USERNAME },
        status: ApiLogStatus.FAILED,
        statusCode: response.status,
        errorMessage: errorText,
        responseTime,
      });
      throw new Error(`Digiflazz API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Log successful API call
    await logApiCall({
      provider: ApiProvider.DIGIFLAZZ,
      endpoint: "/price-list",
      method: "POST",
      requestData: { cmd, username: env.DIGIFLAZZ_USERNAME },
      status: ApiLogStatus.SUCCESS,
      statusCode: 200,
      responseData: { itemCount: Array.isArray(data?.data) ? data.data.length : 0 },
      responseTime,
    });

    // Debug logging for response structure
    if (config.logDebugInfo) {
      const dataKeys = Object.keys(data || {});
      const itemCount = Array.isArray(data?.data) ? data.data.length : "N/A";
      console.log(`[Digiflazz] Response structure: keys=${JSON.stringify(dataKeys)}, items=${itemCount}`);
    }

    // Record the API call for rate limiting
    if (config.enableRateLimit && !options.skipRateLimit) {
      rateLimiter.record(rateLimitKey);
    }

    // Cache the response
    if (!options.skipCache) {
      apiCache.set(cacheKey, data, config.cacheTtlMs);
      if (config.logDebugInfo) {
        console.log(`[Digiflazz] Cached price list for ${cmd} (TTL: ${config.cacheTtlMs}ms)`);
      }
    }

    return data;
  } catch (error) {
    // Log error if not already logged (e.g., network errors)
    if (!(error instanceof Error && error.message.includes("Digiflazz API error"))) {
      await logApiCall({
        provider: ApiProvider.DIGIFLAZZ,
        endpoint: "/price-list",
        method: "POST",
        requestData: { cmd },
        status: error instanceof Error && error.message.includes("timeout") ? ApiLogStatus.TIMEOUT : ApiLogStatus.ERROR,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }
    console.error("Error fetching Digiflazz price list:", error);
    throw error;
  }
}

/**
 * Get balance from Digiflazz
 */
export async function getDigiflazzBalance() {
  const startTime = Date.now();
  try {
    const refId = Date.now().toString();
    const sign = generateDigiflazzSignature(refId);

    const response = await fetch(`${env.DIGIFLAZZ_API_URL}/cek-saldo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: env.DIGIFLAZZ_USERNAME,
        sign: sign,
      }),
    });
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      await logApiCall({
        provider: ApiProvider.DIGIFLAZZ,
        endpoint: "/cek-saldo",
        method: "POST",
        requestData: { username: env.DIGIFLAZZ_USERNAME },
        status: ApiLogStatus.FAILED,
        statusCode: response.status,
        errorMessage: errorText,
        responseTime,
      });
      throw new Error(`Digiflazz API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Log successful API call
    await logApiCall({
      provider: ApiProvider.DIGIFLAZZ,
      endpoint: "/cek-saldo",
      method: "POST",
      requestData: { username: env.DIGIFLAZZ_USERNAME },
      status: ApiLogStatus.SUCCESS,
      statusCode: 200,
      responseData: { deposit: data?.data?.deposit },
      responseTime,
    });

    return data;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    if (!(error instanceof Error && error.message.includes("Digiflazz API error"))) {
      await logApiCall({
        provider: ApiProvider.DIGIFLAZZ,
        endpoint: "/cek-saldo",
        method: "POST",
        status: error instanceof Error && error.message.includes("timeout") ? ApiLogStatus.TIMEOUT : ApiLogStatus.ERROR,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        responseTime,
      });
    }
    console.error("Error fetching Digiflazz balance:", error);
    throw error;
  }
}

/**
 * Topup transaction request to Digiflazz
 * According to documentation: https://developer.digiflazz.com/api/buyer/topup/
 * 
 * Required fields:
 * - username: Username from API settings
 * - buyer_sku_code: Product SKU code
 * - customer_no: Customer number (phone number/game ID)
 * - ref_id: Your unique reference ID
 * - sign: md5(username + apiKey + ref_id)
 */
export interface DigiflazzTopupParams {
  skuCode: string;
  customerNo: string;
  refId: string;
  testing?: boolean;
  maxPrice?: number;
}

export interface DigiflazzTopupResponse {
  ref_id: string;
  customer_no: string;
  buyer_sku_code: string;
  message: string;
  status: "Sukses" | "Pending" | "Gagal";
  rc: string;
  sn?: string;
  buyer_last_saldo?: number;
  price: number;
  tele?: string;
  wa?: string;
}

export async function createDigiflazzTopup(
  params: DigiflazzTopupParams
): Promise<DigiflazzTopupResponse> {
  const startTime = Date.now();
  const sign = generateDigiflazzSignature(params.refId);

  const requestBody = {
    username: env.DIGIFLAZZ_USERNAME,
    buyer_sku_code: params.skuCode,
    customer_no: params.customerNo,
    ref_id: params.refId,
    sign: sign,
    ...(params.testing !== undefined && { testing: params.testing }),
    ...(params.maxPrice !== undefined && { max_price: params.maxPrice }),
  };

  console.log("[Digiflazz] Creating topup transaction:", {
    skuCode: params.skuCode,
    customerNo: params.customerNo,
    refId: params.refId,
  });

  try {
    const response = await fetch(`${env.DIGIFLAZZ_API_URL}/transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      await logApiCall({
        provider: ApiProvider.DIGIFLAZZ,
        endpoint: "/transaction",
        method: "POST",
        requestData: {
          skuCode: params.skuCode,
          customerNo: params.customerNo,
          refId: params.refId
        },
        status: ApiLogStatus.FAILED,
        statusCode: response.status,
        errorMessage: errorText,
        responseTime,
        refId: params.refId,
      });
      throw new Error(`Digiflazz API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const result: DigiflazzTopupResponse = data.data;

    // Log API call based on status
    const logStatus = result.status === "Gagal" ? ApiLogStatus.FAILED : ApiLogStatus.SUCCESS;
    await logApiCall({
      provider: ApiProvider.DIGIFLAZZ,
      endpoint: "/transaction",
      method: "POST",
      requestData: {
        skuCode: params.skuCode,
        customerNo: params.customerNo,
        refId: params.refId
      },
      status: logStatus,
      statusCode: 200,
      responseData: {
        status: result.status,
        rc: result.rc,
        message: result.message,
        sn: result.sn,
      },
      responseTime,
      refId: params.refId,
    });

    console.log("[Digiflazz] Topup response:", {
      refId: result.ref_id,
      status: result.status,
      message: result.message,
      sn: result.sn,
    });

    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    if (!(error instanceof Error && error.message.includes("Digiflazz API error"))) {
      await logApiCall({
        provider: ApiProvider.DIGIFLAZZ,
        endpoint: "/transaction",
        method: "POST",
        requestData: {
          skuCode: params.skuCode,
          customerNo: params.customerNo,
          refId: params.refId
        },
        status: error instanceof Error && error.message.includes("timeout")
          ? ApiLogStatus.TIMEOUT
          : ApiLogStatus.ERROR,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        responseTime,
        refId: params.refId,
      });
    }
    console.error("[Digiflazz] Error creating topup:", error);
    throw error;
  }
}

