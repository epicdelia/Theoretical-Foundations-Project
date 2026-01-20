import { BaseConnector, RateLimitError } from "./base-connector";
import type { FetchResult, RawItemInsert, DataSource } from "./types";
import { CACHE_TTL } from "./cache";

/**
 * Reddit API response types
 */
interface RedditPost {
  id: string;
  title: string;
  url: string;
  selftext?: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  subreddit: string;
  permalink: string;
  is_self: boolean;
  link_flair_text?: string;
  over_18: boolean;
  stickied: boolean;
}

interface RedditListingResponse {
  kind: string;
  data: {
    children: Array<{
      kind: string;
      data: RedditPost;
    }>;
    after: string | null;
  };
}

/**
 * Reddit Connector
 * Uses the public JSON API (no auth required for public subreddits)
 * Targets r/programming and r/MachineLearning
 */
export class RedditConnector extends BaseConnector {
  private readonly API_BASE = "https://www.reddit.com";

  constructor(source: DataSource) {
    super(source);
  }

  protected getCacheTTL(): number {
    return CACHE_TTL.REDDIT;
  }

  protected async fetchItems(): Promise<FetchResult> {
    try {
      const subreddit = this.config.subreddit ?? "programming";
      const sort = this.config.sort ?? "hot";
      const limit = this.config.limit ?? 25;

      const url = `${this.API_BASE}/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`;

      const response = await this.httpGet<RedditListingResponse>(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "TrendPulse:1.0.0 (by /u/TrendPulseBot)",
        },
      });

      if (!response?.data?.children) {
        return {
          success: false,
          items: [],
          error: "Invalid response from Reddit API",
        };
      }

      const items: RawItemInsert[] = [];

      for (const child of response.data.children) {
        const post = child.data;

        // Skip stickied posts and NSFW content
        if (post.stickied || post.over_18) {
          continue;
        }

        items.push({
          source_id: this.source.id,
          external_id: post.id,
          title: post.title,
          url: post.is_self
            ? `https://reddit.com${post.permalink}`
            : post.url,
          content: post.selftext || null,
          author: post.author,
          score: post.score,
          comments_count: post.num_comments,
          published_at: new Date(post.created_utc * 1000).toISOString(),
          metadata: {
            subreddit: post.subreddit,
            permalink: post.permalink,
            is_self: post.is_self,
            flair: post.link_flair_text,
            reddit_url: `https://reddit.com${post.permalink}`,
          },
        });
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
}

/**
 * Helper function to create Reddit connectors for multiple subreddits
 */
export function getDefaultRedditSubreddits(): Array<{
  name: string;
  subreddit: string;
  sort: string;
}> {
  return [
    { name: "Reddit - r/programming", subreddit: "programming", sort: "hot" },
    {
      name: "Reddit - r/MachineLearning",
      subreddit: "MachineLearning",
      sort: "hot",
    },
  ];
}
