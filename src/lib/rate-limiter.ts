/**
 * Rate Limiter for API calls
 * Prevents hitting API rate limits by tracking call timestamps
 */

interface RateLimitConfig {
  maxCalls: number; // Max calls allowed
  windowMs: number; // Time window in milliseconds
  minInterval?: number; // Minimum interval between calls in ms
}

interface RateLimitEntry {
  calls: number[];
  lastCall: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  
  /**
   * Check if a call is allowed based on rate limit rules
   * @param key - Unique identifier for the rate limit (e.g., "digiflazz:price-list")
   * @param config - Rate limit configuration
   * @returns Object with allowed status and wait time if blocked
   */
  check(key: string, config: RateLimitConfig): { allowed: boolean; waitMs: number } {
    const now = Date.now();
    const entry = this.limits.get(key) || { calls: [], lastCall: 0 };

    // Check minimum interval between calls
    if (config.minInterval && entry.lastCall) {
      const timeSinceLastCall = now - entry.lastCall;
      if (timeSinceLastCall < config.minInterval) {
        return {
          allowed: false,
          waitMs: config.minInterval - timeSinceLastCall,
        };
      }
    }

    // Remove calls outside the time window
    const windowStart = now - config.windowMs;
    entry.calls = entry.calls.filter((callTime) => callTime > windowStart);

    // Check if we've exceeded max calls
    if (entry.calls.length >= config.maxCalls) {
      const oldestCall = entry.calls[0];
      const waitMs = config.windowMs - (now - oldestCall);
      return {
        allowed: false,
        waitMs: Math.max(0, waitMs),
      };
    }

    return { allowed: true, waitMs: 0 };
  }

  /**
   * Record a successful API call
   */
  record(key: string): void {
    const now = Date.now();
    const entry = this.limits.get(key) || { calls: [], lastCall: 0 };
    
    entry.calls.push(now);
    entry.lastCall = now;
    
    this.limits.set(key, entry);
  }

  /**
   * Wait for the specified time
   */
  async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Execute a function with rate limiting
   * Will wait automatically if rate limit is hit
   */
  async execute<T>(
    key: string,
    config: RateLimitConfig,
    fn: () => Promise<T>
  ): Promise<T> {
    const { allowed, waitMs } = this.check(key, config);

    if (!allowed) {
      console.log(`Rate limit hit for ${key}, waiting ${waitMs}ms...`);
      await this.wait(waitMs);
    }

    this.record(key);
    return fn();
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear(): void {
    this.limits.clear();
  }

  /**
   * Get current status for a key
   */
  status(key: string): { calls: number; lastCall: number | null } {
    const entry = this.limits.get(key);
    return {
      calls: entry?.calls.length || 0,
      lastCall: entry?.lastCall || null,
    };
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Development rate limit config (conservative for development API limits)
export const DIGIFLAZZ_DEV_RATE_LIMIT: RateLimitConfig = {
  maxCalls: 1, // Only 1 call
  windowMs: 5 * 60 * 1000, // Per 5 minutes
  minInterval: 5 * 60 * 1000, // Minimum 5 minutes between calls
};

// Production rate limit config (adjust based on your actual limits)
export const DIGIFLAZZ_PROD_RATE_LIMIT: RateLimitConfig = {
  maxCalls: 10, // 10 calls
  windowMs: 60 * 1000, // Per minute
  minInterval: 1000, // Minimum 1 second between calls
};

