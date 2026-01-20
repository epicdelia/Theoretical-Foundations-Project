import { BaseConnector, RateLimitError } from "./base-connector";
import type { FetchResult, RawItemInsert, DataSource } from "./types";
import { CACHE_TTL } from "./cache";

/**
 * Product Hunt GraphQL API types
 */
interface PHPost {
  id: string;
  name: string;
  tagline: string;
  description: string | null;
  url: string;
  votesCount: number;
  commentsCount: number;
  createdAt: string;
  website: string;
  makers: Array<{
    id: string;
    name: string;
    username: string;
  }>;
  topics: {
    edges: Array<{
      node: {
        name: string;
      };
    }>;
  };
  thumbnail: {
    url: string;
  } | null;
}

interface PHGraphQLResponse {
  data?: {
    posts?: {
      edges: Array<{
        node: PHPost;
      }>;
    };
  };
  errors?: Array<{
    message: string;
  }>;
}

/**
 * Product Hunt Connector
 * Uses the GraphQL API (requires API token)
 * https://api.producthunt.com/v2/docs
 */
export class ProductHuntConnector extends BaseConnector {
  private readonly API_URL = "https://api.producthunt.com/v2/api/graphql";

  constructor(source: DataSource) {
    super(source);
  }

  protected getCacheTTL(): number {
    return CACHE_TTL.PRODUCT_HUNT;
  }

  protected async fetchItems(): Promise<FetchResult> {
    const accessToken = process.env.PRODUCT_HUNT_ACCESS_TOKEN;

    if (!accessToken) {
      return {
        success: false,
        items: [],
        error: "PRODUCT_HUNT_ACCESS_TOKEN not configured",
      };
    }

    try {
      const limit = this.config.limit ?? 20;

      const query = `
        query GetPosts($first: Int!) {
          posts(first: $first) {
            edges {
              node {
                id
                name
                tagline
                description
                url
                votesCount
                commentsCount
                createdAt
                website
                makers {
                  id
                  name
                  username
                }
                topics {
                  edges {
                    node {
                      name
                    }
                  }
                }
                thumbnail {
                  url
                }
              }
            }
          }
        }
      `;

      const response = await this.graphqlRequest<PHGraphQLResponse>(
        query,
        { first: limit },
        accessToken
      );

      if (response.errors && response.errors.length > 0) {
        const errorMessage = response.errors.map((e) => e.message).join(", ");
        return {
          success: false,
          items: [],
          error: `GraphQL errors: ${errorMessage}`,
        };
      }

      const posts = response.data?.posts?.edges ?? [];

      if (posts.length === 0) {
        return {
          success: false,
          items: [],
          error: "No posts returned from Product Hunt API",
        };
      }

      const items: RawItemInsert[] = posts.map(({ node: post }) => ({
        source_id: this.source.id,
        external_id: post.id,
        title: post.name,
        url: post.url,
        content: `${post.tagline}${post.description ? `\n\n${post.description}` : ""}`,
        author: post.makers?.[0]?.name ?? null,
        score: post.votesCount,
        comments_count: post.commentsCount,
        published_at: post.createdAt,
        metadata: {
          tagline: post.tagline,
          website: post.website,
          thumbnail: post.thumbnail?.url ?? null,
          makers: post.makers?.map((m) => ({
            name: m.name,
            username: m.username,
          })),
          topics: post.topics?.edges?.map((e) => e.node.name) ?? [],
          product_hunt_url: post.url,
        },
      }));

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
   * Make a GraphQL request to Product Hunt API
   */
  private async graphqlRequest<T>(
    query: string,
    variables: Record<string, unknown>,
    accessToken: string
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(this.API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "TrendPulse/1.0",
        },
        body: JSON.stringify({ query, variables }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new RateLimitError(
          "Rate limited by Product Hunt API",
          retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined
        );
      }

      if (response.status === 401) {
        throw new Error("Invalid Product Hunt access token");
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Product Hunt API scope requirements
 * To get an API token:
 * 1. Go to https://www.producthunt.com/v2/oauth/applications
 * 2. Create a new application
 * 3. Use the Developer Token for server-side access
 */
export const PRODUCT_HUNT_API_INFO = {
  authUrl: "https://www.producthunt.com/v2/oauth/applications",
  docsUrl: "https://api.producthunt.com/v2/docs",
  requiredScopes: ["public"],
};
