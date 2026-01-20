import { createClient } from "@/lib/supabase/server";
import type {
  DataSource,
  FetchResult,
  RawItemInsert,
  ConnectorConfig,
} from "./types";
import type { ConnectorStatus } from "@/lib/supabase/types";
import { rateLimiter, RATE_LIMIT_CONFIGS } from "./rate-limiter";
import { cache } from "./cache";

/**
 * Base class for all data source connectors
 * Provides common functionality for fetching, caching, rate limiting, and error handling
 */
export abstract class BaseConnector {
  protected source: DataSource;
  protected config: ConnectorConfig;

  constructor(source: DataSource) {
    this.source = source;
    this.config = source.config as ConnectorConfig;

    // Configure rate limiter for this source
    const rateLimitConfig = RATE_LIMIT_CONFIGS[source.source_type];
    if (rateLimitConfig) {
      rateLimiter.configure(source.id, rateLimitConfig);
    }
  }

  /**
   * Abstract method to be implemented by each connector
   * Fetches items from the data source
   */
  protected abstract fetchItems(): Promise<FetchResult>;

  /**
   * Get the cache key for this connector
   */
  protected getCacheKey(): string {
    return `connector:${this.source.id}`;
  }

  /**
   * Get the cache TTL for this connector type (in milliseconds)
   */
  protected abstract getCacheTTL(): number;

  /**
   * Main fetch method with caching, rate limiting, and error handling
   */
  async fetch(): Promise<FetchResult> {
    // Check cache first
    const cacheKey = this.getCacheKey();
    const cached = cache.get<FetchResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check rate limit
    if (!rateLimiter.canRequest(this.source.id)) {
      const resetTime = rateLimiter.getResetTime(this.source.id);
      return {
        success: false,
        items: [],
        error: "Rate limited",
        rateLimited: true,
        rateLimitResetAt: resetTime ?? undefined,
      };
    }

    try {
      // Record the request
      rateLimiter.recordRequest(this.source.id);

      // Fetch items
      const result = await this.fetchItems();

      // Handle rate limit response from API
      if (result.rateLimited) {
        rateLimiter.markRateLimited(
          this.source.id,
          result.rateLimitResetAt
            ? result.rateLimitResetAt.getTime() - Date.now()
            : undefined
        );
        await this.updateSourceStatus("rate_limited", result.error ?? null);
        return result;
      }

      // Cache successful results
      if (result.success && result.items.length > 0) {
        cache.set(cacheKey, result, this.getCacheTTL());
      }

      // Update source status
      if (result.success) {
        await this.updateSourceStatus("active", null);
      } else {
        await this.updateSourceStatus("error", result.error ?? null);
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await this.updateSourceStatus("error", errorMessage);

      return {
        success: false,
        items: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Fetch and save items to the database
   */
  async fetchAndSave(): Promise<{
    success: boolean;
    itemsSaved: number;
    error?: string;
  }> {
    const result = await this.fetch();

    if (!result.success || result.items.length === 0) {
      return {
        success: result.success,
        itemsSaved: 0,
        error: result.error,
      };
    }

    try {
      const savedCount = await this.saveItems(result.items);
      return {
        success: true,
        itemsSaved: savedCount,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save items";
      return {
        success: false,
        itemsSaved: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Save items to the database (upsert to avoid duplicates)
   */
  protected async saveItems(items: RawItemInsert[]): Promise<number> {
    if (items.length === 0) return 0;

    const supabase = await createClient();

    // Use upsert with external_id + source_id as conflict resolution
    const { data, error } = await supabase
      .from("raw_items")
      .upsert(
        items.map((item) => ({
          ...item,
          fetched_at: new Date().toISOString(),
        })),
        {
          onConflict: "source_id,external_id",
          ignoreDuplicates: false,
        }
      )
      .select("id");

    if (error) {
      throw new Error(`Failed to save items: ${error.message}`);
    }

    return data?.length ?? 0;
  }

  /**
   * Update the source status in the database
   */
  protected async updateSourceStatus(
    status: ConnectorStatus,
    error: string | null
  ): Promise<void> {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "active") {
      updateData.last_fetch_at = new Date().toISOString();
      updateData.last_error = null;
      updateData.rate_limit_reset_at = null;
    } else if (status === "error") {
      updateData.last_error = error;
    } else if (status === "rate_limited") {
      updateData.last_error = error;
      const resetTime = rateLimiter.getResetTime(this.source.id);
      if (resetTime) {
        updateData.rate_limit_reset_at = resetTime.toISOString();
      }
    }

    await supabase
      .from("data_sources")
      .update(updateData)
      .eq("id", this.source.id);
  }

  /**
   * Make an HTTP request with timeout and error handling
   */
  protected async httpGet<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "TrendPulse/1.0",
          ...options.headers,
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(
          "Rate limited by API",
          retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined
        );
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Make an HTTP request for HTML content
   */
  protected async httpGetHtml(
    url: string,
    options: RequestInit = {}
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "text/html",
          "User-Agent":
            "Mozilla/5.0 (compatible; TrendPulse/1.0; +https://trendpulse.app)",
          ...options.headers,
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(
          "Rate limited by API",
          retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined
        );
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Custom error for rate limiting
 */
export class RateLimitError extends Error {
  retryAfterMs?: number;

  constructor(message: string, retryAfterMs?: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
  }
}
