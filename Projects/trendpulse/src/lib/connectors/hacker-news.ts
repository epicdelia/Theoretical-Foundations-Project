import { BaseConnector, RateLimitError } from "./base-connector";
import type { FetchResult, RawItemInsert, DataSource } from "./types";
import { CACHE_TTL } from "./cache";

/**
 * Hacker News API response types
 */
interface HNItem {
  id: number;
  title?: string;
  url?: string;
  text?: string;
  by?: string;
  score?: number;
  descendants?: number; // comment count
  time?: number;
  type?: string;
}

/**
 * Hacker News Connector
 * Uses the official Firebase-based HN API
 * https://github.com/HackerNews/API
 */
export class HackerNewsConnector extends BaseConnector {
  private readonly API_BASE = "https://hacker-news.firebaseio.com/v0";

  constructor(source: DataSource) {
    super(source);
  }

  protected getCacheTTL(): number {
    return CACHE_TTL.HACKER_NEWS;
  }

  protected async fetchItems(): Promise<FetchResult> {
    try {
      const itemsToFetch = this.config.items_per_fetch ?? 30;

      // Get top story IDs
      const storyIds = await this.httpGet<number[]>(
        `${this.API_BASE}/topstories.json`
      );

      if (!storyIds || storyIds.length === 0) {
        return {
          success: false,
          items: [],
          error: "No stories returned from HN API",
        };
      }

      // Fetch details for top N stories
      const topIds = storyIds.slice(0, itemsToFetch);
      const items: RawItemInsert[] = [];

      // Fetch stories in parallel batches of 10
      const batchSize = 10;
      for (let i = 0; i < topIds.length; i += batchSize) {
        const batch = topIds.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map((id) => this.fetchStoryDetails(id))
        );

        for (const item of batchResults) {
          if (item) {
            items.push(item);
          }
        }
      }

      return {
        success: true,
        items,
      };
    } catch (error) {
      if (error instanceof RateLimitError) {
        return {
          success: false,
          items: [],
          error: error.message,
          rateLimited: true,
          rateLimitResetAt: error.retryAfterMs
            ? new Date(Date.now() + error.retryAfterMs)
            : undefined,
        };
      }

      throw error;
    }
  }

  /**
   * Fetch details for a single story
   */
  private async fetchStoryDetails(id: number): Promise<RawItemInsert | null> {
    try {
      const story = await this.httpGet<HNItem>(
        `${this.API_BASE}/item/${id}.json`
      );

      // Skip non-story items or deleted items
      if (
        !story ||
        !story.title ||
        story.type !== "story" ||
        story.title === "[deleted]"
      ) {
        return null;
      }

      return {
        source_id: this.source.id,
        external_id: String(story.id),
        title: story.title,
        url: story.url ?? `https://news.ycombinator.com/item?id=${story.id}`,
        content: story.text ?? null,
        author: story.by ?? null,
        score: story.score ?? 0,
        comments_count: story.descendants ?? 0,
        published_at: story.time
          ? new Date(story.time * 1000).toISOString()
          : null,
        metadata: {
          hn_id: story.id,
          type: story.type,
          is_ask_hn: story.title?.startsWith("Ask HN:"),
          is_show_hn: story.title?.startsWith("Show HN:"),
          is_tell_hn: story.title?.startsWith("Tell HN:"),
        },
      };
    } catch {
      // Log error but don't fail the entire fetch
      console.error(`Failed to fetch HN story ${id}`);
      return null;
    }
  }
}
