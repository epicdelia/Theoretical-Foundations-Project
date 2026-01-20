import { BaseConnector, RateLimitError } from "./base-connector";
import type { FetchResult, RawItemInsert, DataSource } from "./types";
import { CACHE_TTL } from "./cache";

/**
 * Parsed RSS feed item
 */
interface RSSItem {
  title: string;
  link: string;
  description: string;
  author: string | null;
  pubDate: string | null;
  guid: string;
  categories: string[];
}

/**
 * RSS Feed Connector
 * Parses standard RSS 2.0 and Atom feeds
 * Targets TechCrunch, The Verge, Ars Technica
 */
export class RSSConnector extends BaseConnector {
  constructor(source: DataSource) {
    super(source);
  }

  protected getCacheTTL(): number {
    return CACHE_TTL.RSS;
  }

  protected async fetchItems(): Promise<FetchResult> {
    try {
      const feedUrl = this.config.feed_url;

      if (!feedUrl) {
        return {
          success: false,
          items: [],
          error: "No feed URL configured",
        };
      }

      const xml = await this.httpGetHtml(feedUrl, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml",
        },
      });

      const feedItems = this.parseRSS(xml);

      if (feedItems.length === 0) {
        return {
          success: false,
          items: [],
          error: "No items found in RSS feed",
        };
      }

      const limit = this.config.limit ?? 25;
      const items: RawItemInsert[] = feedItems.slice(0, limit).map((item) => ({
        source_id: this.source.id,
        external_id: item.guid || item.link,
        title: item.title,
        url: item.link,
        content: this.stripHtml(item.description),
        author: item.author,
        score: 0, // RSS doesn't have scoring
        comments_count: 0,
        published_at: item.pubDate ? this.parseDate(item.pubDate) : null,
        metadata: {
          categories: item.categories,
          feed_url: feedUrl,
          original_description: item.description,
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
   * Parse RSS 2.0 or Atom feed
   */
  private parseRSS(xml: string): RSSItem[] {
    // Try RSS 2.0 first, then Atom
    const items = this.parseRSS2(xml);
    if (items.length > 0) {
      return items;
    }

    return this.parseAtom(xml);
  }

  /**
   * Parse RSS 2.0 format
   */
  private parseRSS2(xml: string): RSSItem[] {
    const items: RSSItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];

      const title = this.extractTag(itemXml, "title");
      const link = this.extractTag(itemXml, "link");
      const description = this.extractTag(itemXml, "description");
      const author =
        this.extractTag(itemXml, "author") ||
        this.extractTag(itemXml, "dc:creator");
      const pubDate = this.extractTag(itemXml, "pubDate");
      const guid = this.extractTag(itemXml, "guid") || link;
      const categories = this.extractAllTags(itemXml, "category");

      if (title && link) {
        items.push({
          title: this.decodeEntities(title),
          link: link,
          description: description || "",
          author: author ? this.decodeEntities(author) : null,
          pubDate,
          guid: guid || link,
          categories: categories.map((c) => this.decodeEntities(c)),
        });
      }
    }

    return items;
  }

  /**
   * Parse Atom format
   */
  private parseAtom(xml: string): RSSItem[] {
    const items: RSSItem[] = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXml = match[1];

      const title = this.extractTag(entryXml, "title");
      const link = this.extractAtomLink(entryXml);
      const content =
        this.extractTag(entryXml, "content") ||
        this.extractTag(entryXml, "summary");
      const author = this.extractAtomAuthor(entryXml);
      const published =
        this.extractTag(entryXml, "published") ||
        this.extractTag(entryXml, "updated");
      const id = this.extractTag(entryXml, "id") || link;
      const categories = this.extractAtomCategories(entryXml);

      if (title && link) {
        items.push({
          title: this.decodeEntities(title),
          link,
          description: content || "",
          author: author ? this.decodeEntities(author) : null,
          pubDate: published,
          guid: id || link,
          categories,
        });
      }
    }

    return items;
  }

  /**
   * Extract a single XML tag value
   */
  private extractTag(xml: string, tagName: string): string | null {
    // Handle CDATA sections
    const cdataRegex = new RegExp(
      `<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`,
      "i"
    );
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) {
      return cdataMatch[1].trim();
    }

    // Handle regular tags
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract all occurrences of a tag
   */
  private extractAllTags(xml: string, tagName: string): string[] {
    const results: string[] = [];
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi");
    let match;

    while ((match = regex.exec(xml)) !== null) {
      results.push(match[1].trim());
    }

    return results;
  }

  /**
   * Extract link from Atom entry
   */
  private extractAtomLink(xml: string): string | null {
    // Try to find alternate link first
    const alternateMatch = xml.match(
      /<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i
    );
    if (alternateMatch) {
      return alternateMatch[1];
    }

    // Fall back to any link
    const linkMatch = xml.match(/<link[^>]*href=["']([^"']+)["']/i);
    return linkMatch ? linkMatch[1] : null;
  }

  /**
   * Extract author from Atom entry
   */
  private extractAtomAuthor(xml: string): string | null {
    const authorMatch = xml.match(
      /<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/i
    );
    return authorMatch ? authorMatch[1].trim() : null;
  }

  /**
   * Extract categories from Atom entry
   */
  private extractAtomCategories(xml: string): string[] {
    const categories: string[] = [];
    const categoryRegex = /<category[^>]*term=["']([^"']+)["']/gi;
    let match;

    while ((match = categoryRegex.exec(xml)) !== null) {
      categories.push(match[1]);
    }

    return categories;
  }

  /**
   * Decode HTML entities
   */
  private decodeEntities(str: string): string {
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
  }

  /**
   * Strip HTML tags from string
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Parse date string to ISO format
   */
  private parseDate(dateStr: string): string | null {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString();
    } catch {
      return null;
    }
  }
}

/**
 * Default RSS feeds for tech news
 */
export const DEFAULT_RSS_FEEDS = [
  {
    name: "TechCrunch",
    feed_url: "https://techcrunch.com/feed/",
  },
  {
    name: "The Verge",
    feed_url: "https://www.theverge.com/rss/index.xml",
  },
  {
    name: "Ars Technica",
    feed_url: "https://feeds.arstechnica.com/arstechnica/index",
  },
];
