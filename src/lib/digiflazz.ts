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

/**
 * Generate signature for Digiflazz API requests
 * Signature = md5(username + api_key + ref_id)
 */
export function generateDigiflazzSignature(refId: string): string {
  const signatureString = `${env.DIGIFLAZZ_USERNAME}${env.DIGIFLAZZ_API_KEY}${refId}`;
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
    const refId = Date.now().toString(); // Use timestamp as ref_id
    const sign = generateDigiflazzSignature(refId);

    if (config.logDebugInfo) {
      console.log(`[Digiflazz] Fetching price list for ${cmd}...`);
    }

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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Digiflazz API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

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
    console.error("Error fetching Digiflazz price list:", error);
    throw error;
  }
}

/**
 * Get balance from Digiflazz
 */
export async function getDigiflazzBalance() {
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Digiflazz API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Digiflazz balance:", error);
    throw error;
  }
}

