// Types
export type {
  ConnectorConfig,
  DataSource,
  RawItemInsert,
  FetchResult,
  ConnectorStatusInfo,
  RateLimitConfig,
  CacheEntry,
} from "./types";

// Base connector
export { BaseConnector, RateLimitError } from "./base-connector";

// Individual connectors
export { HackerNewsConnector } from "./hacker-news";
export { RedditConnector, getDefaultRedditSubreddits } from "./reddit";
export { GitHubTrendingConnector } from "./github-trending";
export { RSSConnector, DEFAULT_RSS_FEEDS } from "./rss";
export { ProductHuntConnector, PRODUCT_HUNT_API_INFO } from "./product-hunt";

// Factory and utilities
export {
  createConnector,
  getSourceTypeName,
  getSourceTypeIcon,
  requiresApiCredentials,
  getRequiredEnvVars,
} from "./factory";

// Rate limiting
export { rateLimiter, RATE_LIMIT_CONFIGS } from "./rate-limiter";

// Caching
export { cache, CACHE_TTL } from "./cache";

// Connector service
export { ConnectorService, connectorService } from "./service";
