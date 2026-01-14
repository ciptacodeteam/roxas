/**
 * Configuration for price synchronization
 * Centralized settings for different environments
 */

import { env } from "@/env";

export interface SyncConfig {
  // Cache settings
  cacheTtlMs: number; // How long to cache API responses
  
  // Rate limiting
  enableRateLimit: boolean;
  rateLimit: {
    maxCalls: number;
    windowMs: number;
    minInterval: number;
  };
  
  // Sync intervals
  autoSyncIntervalMinutes: number; // How often to auto-sync
  stalePriceThresholdMinutes: number; // When prices are considered stale
  
  // Batch processing
  batchSize: number; // Number of items to update in a single transaction
  
  // Development features
  useMockData: boolean; // Use mock data instead of real API
  logDebugInfo: boolean; // Enable detailed logging
}

/**
 * Get configuration based on environment
 */
export function getSyncConfig(): SyncConfig {
  const isDevelopment = env.NODE_ENV === "development";
  const isProduction = env.NODE_ENV === "production";

  if (isDevelopment) {
    return {
      // Development: Conservative settings due to API limits
      cacheTtlMs: 10 * 60 * 1000, // 10 minutes cache
      enableRateLimit: true,
      rateLimit: {
        maxCalls: 1,
        windowMs: 5 * 60 * 1000, // 5 minutes
        minInterval: 5 * 60 * 1000, // 5 minutes between calls
      },
      autoSyncIntervalMinutes: 30, // Auto-sync every 30 minutes
      stalePriceThresholdMinutes: 30, // Prices stale after 30 minutes
      batchSize: 100, // Update 100 items per batch
      useMockData: false, // Set to true to use mock data in dev
      logDebugInfo: true,
    };
  }

  if (isProduction) {
    return {
      // Production: More aggressive settings
      cacheTtlMs: 5 * 60 * 1000, // 5 minutes cache
      enableRateLimit: true,
      rateLimit: {
        maxCalls: 10,
        windowMs: 60 * 1000, // 1 minute
        minInterval: 1000, // 1 second between calls
      },
      autoSyncIntervalMinutes: 60, // Auto-sync every hour
      stalePriceThresholdMinutes: 60, // Prices stale after 1 hour
      batchSize: 500, // Update 500 items per batch
      useMockData: false,
      logDebugInfo: false,
    };
  }

  // Test/staging: Balanced settings
  return {
    cacheTtlMs: 5 * 60 * 1000,
    enableRateLimit: true,
    rateLimit: {
      maxCalls: 5,
      windowMs: 5 * 60 * 1000,
      minInterval: 60 * 1000,
    },
    autoSyncIntervalMinutes: 30,
    stalePriceThresholdMinutes: 30,
    batchSize: 200,
    useMockData: false,
    logDebugInfo: true,
  };
}

/**
 * Get cache key for price list
 */
export function getPriceListCacheKey(cmd: "prepaid" | "pasca"): string {
  return `digiflazz:price-list:${cmd}`;
}

/**
 * Get rate limit key for Digiflazz API
 */
export function getDigiflazzRateLimitKey(endpoint: string): string {
  return `digiflazz:${endpoint}`;
}

