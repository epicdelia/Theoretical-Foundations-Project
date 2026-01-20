import type { SourceType, ConnectorStatus, Json } from "@/lib/supabase/types";

/**
 * Configuration for each data source connector
 */
export interface ConnectorConfig {
  endpoint?: string;
  items_per_fetch?: number;
  subreddit?: string;
  sort?: string;
  limit?: number;
  language?: string;
  timeframe?: string;
  feed_url?: string;
  category?: string;
}

/**
 * Data source record from the database
 */
export interface DataSource {
  id: string;
  name: string;
  source_type: SourceType;
  config: ConnectorConfig;
  status: ConnectorStatus;
  last_fetch_at: string | null;
  last_error: string | null;
  rate_limit_reset_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Raw item to be inserted into the database
 */
export interface RawItemInsert {
  source_id: string;
  external_id: string;
  title: string;
  url?: string | null;
  content?: string | null;
  author?: string | null;
  score?: number;
  comments_count?: number;
  published_at?: string | null;
  metadata?: Json;
}

/**
 * Result of a connector fetch operation
 */
export interface FetchResult {
  success: boolean;
  items: RawItemInsert[];
  error?: string;
  rateLimited?: boolean;
  rateLimitResetAt?: Date;
}

/**
 * Connector status information for dashboard
 */
export interface ConnectorStatusInfo {
  id: string;
  name: string;
  sourceType: SourceType;
  status: ConnectorStatus;
  lastFetchAt: string | null;
  lastError: string | null;
  rateLimitResetAt: string | null;
  itemsFetchedToday: number;
  isHealthy: boolean;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs: number;
}

/**
 * Cache entry structure
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}
