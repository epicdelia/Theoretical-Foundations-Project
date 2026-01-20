import { BaseConnector, RateLimitError } from "./base-connector";
import type { FetchResult, RawItemInsert, DataSource } from "./types";
import { CACHE_TTL } from "./cache";

/**
 * Parsed repository from GitHub trending page
 */
interface TrendingRepo {
  name: string;
  owner: string;
  description: string;
  url: string;
  language: string | null;
  stars: number;
  starsToday: number;
  forks: number;
}

/**
 * GitHub Trending Connector
 * Parses the public GitHub trending page (no API required)
 * https://github.com/trending
 */
export class GitHubTrendingConnector extends BaseConnector {
  private readonly TRENDING_URL = "https://github.com/trending";

  constructor(source: DataSource) {
    super(source);
  }

  protected getCacheTTL(): number {
    return CACHE_TTL.GITHUB_TRENDING;
  }

  protected async fetchItems(): Promise<FetchResult> {
    try {
      const language = this.config.language ?? "";
      const timeframe = this.config.timeframe ?? "daily";

      let url = this.TRENDING_URL;
      if (language) {
        url += `/${encodeURIComponent(language)}`;
      }
      url += `?since=${timeframe}`;

      const html = await this.httpGetHtml(url);
      const repos = this.parseHtml(html);

      if (repos.length === 0) {
        return {
          success: false,
          items: [],
          error: "No repositories found on trending page",
        };
      }

      const items: RawItemInsert[] = repos.map((repo) => ({
        source_id: this.source.id,
        external_id: `${repo.owner}/${repo.name}`,
        title: `${repo.owner}/${repo.name}`,
        url: repo.url,
        content: repo.description,
        author: repo.owner,
        score: repo.stars,
        comments_count: repo.forks,
        published_at: new Date().toISOString(), // Trending doesn't give creation date
        metadata: {
          language: repo.language,
          stars_today: repo.starsToday,
          forks: repo.forks,
          full_name: `${repo.owner}/${repo.name}`,
          timeframe,
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
   * Parse the GitHub trending HTML page
   * Uses regex-based parsing (no external dependencies)
   */
  private parseHtml(html: string): TrendingRepo[] {
    const repos: TrendingRepo[] = [];

    // Match each repository article
    const articleRegex =
      /<article class="Box-row"[^>]*>([\s\S]*?)<\/article>/g;
    let articleMatch;

    while ((articleMatch = articleRegex.exec(html)) !== null) {
      const articleHtml = articleMatch[1];

      try {
        const repo = this.parseRepoArticle(articleHtml);
        if (repo) {
          repos.push(repo);
        }
      } catch {
        // Skip malformed entries
        continue;
      }
    }

    return repos;
  }

  /**
   * Parse a single repository article
   */
  private parseRepoArticle(html: string): TrendingRepo | null {
    // Extract repo URL and name
    const repoLinkMatch = html.match(
      /<h2[^>]*>[\s\S]*?<a[^>]*href="\/([^"]+)"[^>]*>[\s\S]*?<\/a>/
    );
    if (!repoLinkMatch) return null;

    const fullName = repoLinkMatch[1].trim();
    const [owner, name] = fullName.split("/");
    if (!owner || !name) return null;

    // Extract description
    const descMatch = html.match(/<p class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    const description = descMatch
      ? descMatch[1].trim().replace(/<[^>]+>/g, "").trim()
      : "";

    // Extract programming language
    const langMatch = html.match(
      /<span[^>]*itemprop="programmingLanguage"[^>]*>([^<]+)<\/span>/
    );
    const language = langMatch ? langMatch[1].trim() : null;

    // Extract total stars
    const starsMatch = html.match(
      /<a[^>]*href="\/[^"]+\/stargazers"[^>]*>[\s\S]*?([\d,]+)[\s\S]*?<\/a>/
    );
    const stars = starsMatch
      ? parseInt(starsMatch[1].replace(/,/g, ""), 10)
      : 0;

    // Extract forks
    const forksMatch = html.match(
      /<a[^>]*href="\/[^"]+\/forks"[^>]*>[\s\S]*?([\d,]+)[\s\S]*?<\/a>/
    );
    const forks = forksMatch
      ? parseInt(forksMatch[1].replace(/,/g, ""), 10)
      : 0;

    // Extract stars today
    const starsTodayMatch = html.match(/([\d,]+)\s+stars?\s+(today|this week|this month)/i);
    const starsToday = starsTodayMatch
      ? parseInt(starsTodayMatch[1].replace(/,/g, ""), 10)
      : 0;

    return {
      name,
      owner,
      description,
      url: `https://github.com/${fullName}`,
      language,
      stars,
      starsToday,
      forks,
    };
  }
}
