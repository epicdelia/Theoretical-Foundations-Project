import type { RateLimitConfig } from "./types";

interface RateLimitState {
  requests: number;
  windowStart: number;
  blocked: boolean;
  blockedUntil: number;
}

/**
 * Token bucket rate limiter for API calls
 * Tracks requests per time window and blocks when limit is exceeded
 */
class RateLimiter {
  private limits: Map<string, RateLimitState> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  /**
   * Register rate limit configuration for a source
   */
  configure(sourceId: string, config: RateLimitConfig): void {
    this.configs.set(sourceId, config);
    this.limits.set(sourceId, {
      requests: 0,
      windowStart: Date.now(),
      blocked: false,
      blockedUntil: 0,
    });
  }

  /**
   * Check if a request can be made (doesn't consume a token)
   */
  canRequest(sourceId: string): boolean {
    const state = this.limits.get(sourceId);
    const config = this.configs.get(sourceId);

    if (!state || !config) {
      return true; // No rate limit configured
    }

    const now = Date.now();

    // Check if we're in a blocked state
    if (state.blocked && now < state.blockedUntil) {
      return false;
    }

    // Reset block if time has passed
    if (state.blocked && now >= state.blockedUntil) {
      state.blocked = false;
      state.requests = 0;
      state.windowStart = now;
    }

    // Check if window has expired
    if (now - state.windowStart >= config.windowMs) {
      state.requests = 0;
      state.windowStart = now;
    }

    return state.requests < config.maxRequests;
  }

  /**
   * Record a request (consumes a token)
   */
  recordRequest(sourceId: string): void {
    const state = this.limits.get(sourceId);
    if (state) {
      state.requests++;
    }
  }

  /**
   * Mark source as rate limited (external rate limit hit)
   */
  markRateLimited(sourceId: string, retryAfterMs?: number): void {
    const state = this.limits.get(sourceId);
    const config = this.configs.get(sourceId);

    if (state) {
      state.blocked = true;
      state.blockedUntil =
        Date.now() + (retryAfterMs ?? config?.retryAfterMs ?? 60000);
    }
  }

  /**
   * Get time until rate limit resets
   */
  getResetTime(sourceId: string): Date | null {
    const state = this.limits.get(sourceId);
    const config = this.configs.get(sourceId);

    if (!state || !config) return null;

    if (state.blocked) {
      return new Date(state.blockedUntil);
    }

    // Return window expiry time
    return new Date(state.windowStart + config.windowMs);
  }

  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(sourceId: string): number {
    const state = this.limits.get(sourceId);
    const config = this.configs.get(sourceId);

    if (!state || !config) return Infinity;

    if (state.blocked) return 0;

    return Math.max(0, config.maxRequests - state.requests);
  }

  /**
   * Check if source is currently blocked
   */
  isBlocked(sourceId: string): boolean {
    const state = this.limits.get(sourceId);
    if (!state) return false;

    if (state.blocked && Date.now() < state.blockedUntil) {
      return true;
    }

    return false;
  }

  /**
   * Reset rate limit state for a source
   */
  reset(sourceId: string): void {
    const state = this.limits.get(sourceId);
    if (state) {
      state.requests = 0;
      state.windowStart = Date.now();
      state.blocked = false;
      state.blockedUntil = 0;
    }
  }
}

// Singleton rate limiter instance
export const rateLimiter = new RateLimiter();

// Default rate limit configurations per source type
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  hackernews: {
    maxRequests: 30, // HN API is generous
    windowMs: 60 * 1000, // 1 minute
    retryAfterMs: 30 * 1000, // 30 seconds
  },
  reddit: {
    maxRequests: 10, // Reddit is stricter
    windowMs: 60 * 1000, // 1 minute
    retryAfterMs: 60 * 1000, // 1 minute
  },
  github_trending: {
    maxRequests: 10, // Scraping, be conservative
    windowMs: 60 * 1000, // 1 minute
    retryAfterMs: 120 * 1000, // 2 minutes
  },
  rss: {
    maxRequests: 20, // RSS feeds are usually lenient
    windowMs: 60 * 1000, // 1 minute
    retryAfterMs: 30 * 1000, // 30 seconds
  },
  product_hunt: {
    maxRequests: 10, // API limits
    windowMs: 60 * 1000, // 1 minute
    retryAfterMs: 60 * 1000, // 1 minute
  },
};
