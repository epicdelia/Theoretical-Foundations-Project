import type { SourceType } from "@/lib/supabase/types";
import type { DataSource } from "./types";
import { BaseConnector } from "./base-connector";
import { HackerNewsConnector } from "./hacker-news";
import { RedditConnector } from "./reddit";
import { GitHubTrendingConnector } from "./github-trending";
import { RSSConnector } from "./rss";
import { ProductHuntConnector } from "./product-hunt";

/**
 * Factory function to create the appropriate connector for a data source
 */
export function createConnector(source: DataSource): BaseConnector {
  switch (source.source_type) {
    case "hackernews":
      return new HackerNewsConnector(source);
    case "reddit":
      return new RedditConnector(source);
    case "github_trending":
      return new GitHubTrendingConnector(source);
    case "rss":
      return new RSSConnector(source);
    case "product_hunt":
      return new ProductHuntConnector(source);
    default:
      throw new Error(`Unknown source type: ${source.source_type}`);
  }
}

/**
 * Get human-readable name for a source type
 */
export function getSourceTypeName(sourceType: SourceType): string {
  const names: Record<SourceType, string> = {
    hackernews: "Hacker News",
    reddit: "Reddit",
    github_trending: "GitHub Trending",
    rss: "RSS Feed",
    product_hunt: "Product Hunt",
  };
  return names[sourceType] ?? sourceType;
}

/**
 * Get icon name for a source type (Lucide icon names)
 */
export function getSourceTypeIcon(sourceType: SourceType): string {
  const icons: Record<SourceType, string> = {
    hackernews: "flame",
    reddit: "message-square",
    github_trending: "github",
    rss: "rss",
    product_hunt: "rocket",
  };
  return icons[sourceType] ?? "globe";
}

/**
 * Check if a source type requires API credentials
 */
export function requiresApiCredentials(sourceType: SourceType): boolean {
  return sourceType === "product_hunt";
}

/**
 * Get required environment variables for a source type
 */
export function getRequiredEnvVars(sourceType: SourceType): string[] {
  const envVars: Partial<Record<SourceType, string[]>> = {
    product_hunt: ["PRODUCT_HUNT_ACCESS_TOKEN"],
  };
  return envVars[sourceType] ?? [];
}
