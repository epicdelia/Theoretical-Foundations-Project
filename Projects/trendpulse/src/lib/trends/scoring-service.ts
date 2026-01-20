import { createClient } from "@/lib/supabase/server";
import type {
  RawItem,
  TrendCandidate,
  ScoreBreakdown,
  TrendSignals,
  TrendInsert,
  ScoringResult,
} from "./types";
import {
  normalizeTitle,
  areTitlesSimilar,
  selectBestTitle,
} from "./fuzzy-match";

/**
 * Keywords that indicate relevance to tech/AI audience
 */
const RELEVANCE_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "llm",
  "large language model",
  "gpt",
  "claude",
  "openai",
  "anthropic",
  "machine learning",
  "ml",
  "deep learning",
  "neural",
  "developer",
  "api",
  "startup",
  "coding",
  "programming",
  "github",
  "open source",
  "opensource",
  "saas",
  "software",
  "tech",
  "technology",
  "data",
  "cloud",
  "devops",
  "frontend",
  "backend",
  "fullstack",
  "javascript",
  "typescript",
  "python",
  "rust",
  "react",
  "nextjs",
  "node",
  "crypto",
  "blockchain",
  "web3",
  "automation",
  "productivity",
  "remote",
  "founder",
  "vc",
  "funding",
  "launch",
  "product",
];

/**
 * Generate a URL-safe slug from a title
 */
function generateSlug(title: string, date: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50)
    .replace(/-$/, "");

  return `${baseSlug}-${date}`;
}

/**
 * Trend Scoring Service
 * Aggregates raw items, deduplicates topics, and scores trends
 */
export class TrendScoringService {
  /**
   * Run the full scoring pipeline
   */
  async scoreTrends(): Promise<ScoringResult> {
    const startTime = Date.now();
    const supabase = await createClient();

    try {
      // Log job start
      const { data: jobLog } = await supabase
        .from("job_logs")
        .insert({
          job_type: "score_trends",
          status: "running",
          items_processed: 0,
        })
        .select()
        .single();

      const jobId = jobLog?.id;

      // Step 1: Fetch recent raw items (last 24 hours)
      const rawItems = await this.fetchRecentRawItems();

      if (rawItems.length === 0) {
        await this.updateJobLog(jobId, "completed", 0);
        return {
          success: true,
          trendsProcessed: 0,
          trendsCreated: 0,
        };
      }

      // Step 2: Get source type mapping
      const sourceTypes = await this.getSourceTypes();

      // Step 3: Group similar items into trend candidates
      const candidates = this.groupSimilarItems(rawItems, sourceTypes);

      // Step 4: Score each candidate
      const scoredCandidates = await this.scoreCandidates(candidates);

      // Step 5: Select top trends and save to database
      const trendsCreated = await this.saveTrends(scoredCandidates);

      // Update job log
      const duration = Date.now() - startTime;
      await this.updateJobLog(jobId, "completed", trendsCreated, null, duration);

      return {
        success: true,
        trendsProcessed: candidates.length,
        trendsCreated,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error during scoring";

      // Try to log the failure
      try {
        const supabaseForLog = await createClient();
        await supabaseForLog.from("job_logs").insert({
          job_type: "score_trends",
          status: "failed",
          items_processed: 0,
          error_message: message,
          completed_at: new Date().toISOString(),
        });
      } catch {
        // Ignore logging errors
      }

      return {
        success: false,
        trendsProcessed: 0,
        trendsCreated: 0,
        error: message,
      };
    }
  }

  /**
   * Fetch raw items from the last 24 hours
   */
  private async fetchRecentRawItems(): Promise<RawItem[]> {
    const supabase = await createClient();

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    const { data, error } = await supabase
      .from("raw_items")
      .select("*")
      .gte("fetched_at", cutoff.toISOString())
      .order("fetched_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch raw items: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get mapping of source IDs to source types
   */
  private async getSourceTypes(): Promise<Map<string, string>> {
    const supabase = await createClient();

    const { data, error } = await supabase.from("data_sources").select("id, source_type");

    if (error) {
      throw new Error(`Failed to fetch source types: ${error.message}`);
    }

    const map = new Map<string, string>();
    for (const source of data ?? []) {
      map.set(source.id, source.source_type);
    }

    return map;
  }

  /**
   * Group similar raw items into trend candidates using fuzzy matching
   */
  private groupSimilarItems(
    items: RawItem[],
    sourceTypes: Map<string, string>
  ): TrendCandidate[] {
    const candidates: TrendCandidate[] = [];

    for (const item of items) {
      const normalizedTitle = normalizeTitle(item.title);

      // Try to find an existing candidate that matches
      let matched = false;
      for (const candidate of candidates) {
        if (areTitlesSimilar(item.title, candidate.title, 0.5)) {
          // Add to existing candidate
          candidate.items.push(item);
          candidate.sourceIds.add(item.source_id);
          candidate.sourceTypes.add(sourceTypes.get(item.source_id) ?? "unknown");

          if (item.url) {
            candidate.urls.push(item.url);
          }

          candidate.totalScore += item.score;
          candidate.totalComments += item.comments_count;

          // Update date range
          if (item.published_at) {
            const pubDate = new Date(item.published_at);
            if (!candidate.earliestPublished || pubDate < candidate.earliestPublished) {
              candidate.earliestPublished = pubDate;
            }
            if (!candidate.latestPublished || pubDate > candidate.latestPublished) {
              candidate.latestPublished = pubDate;
            }
          }

          matched = true;
          break;
        }
      }

      if (!matched) {
        // Create new candidate
        const pubDate = item.published_at ? new Date(item.published_at) : null;

        candidates.push({
          title: item.title,
          normalizedTitle,
          items: [item],
          sourceIds: new Set([item.source_id]),
          sourceTypes: new Set([sourceTypes.get(item.source_id) ?? "unknown"]),
          urls: item.url ? [item.url] : [],
          totalScore: item.score,
          totalComments: item.comments_count,
          earliestPublished: pubDate,
          latestPublished: pubDate,
        });
      }
    }

    return candidates;
  }

  /**
   * Score all candidates
   */
  private async scoreCandidates(
    candidates: TrendCandidate[]
  ): Promise<Array<{ candidate: TrendCandidate; scores: ScoreBreakdown; signals: TrendSignals }>> {
    const results: Array<{
      candidate: TrendCandidate;
      scores: ScoreBreakdown;
      signals: TrendSignals;
    }> = [];

    // Get historical data for novelty calculation
    const previousTrends = await this.getPreviousTrends();

    for (const candidate of candidates) {
      const signals = this.calculateSignals(candidate, previousTrends);
      const scores = this.calculateScores(signals);

      results.push({ candidate, scores, signals });
    }

    // Sort by total score descending
    results.sort((a, b) => b.scores.total - a.scores.total);

    return results;
  }

  /**
   * Get previous trends for novelty calculation
   */
  private async getPreviousTrends(): Promise<Map<string, Date>> {
    const supabase = await createClient();

    // Look back 7 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);

    const { data, error } = await supabase
      .from("trends")
      .select("title, created_at")
      .gte("created_at", cutoff.toISOString());

    if (error) {
      console.error("Failed to fetch previous trends:", error.message);
      return new Map();
    }

    const map = new Map<string, Date>();
    for (const trend of data ?? []) {
      const normalized = normalizeTitle(trend.title);
      map.set(normalized, new Date(trend.created_at));
    }

    return map;
  }

  /**
   * Calculate signals for a trend candidate
   */
  private calculateSignals(
    candidate: TrendCandidate,
    previousTrends: Map<string, Date>
  ): TrendSignals {
    // Mention count (24h) = number of raw items
    const mentionCount24h = candidate.items.length;

    // For 7d average, we'd ideally query historical data
    // For now, use current count as a proxy (this will improve with more data)
    const mentionCount7dAvg = Math.max(1, Math.floor(mentionCount24h / 2));

    // Source types
    const sourceTypes = Array.from(candidate.sourceTypes);

    // Matched keywords
    const matchedKeywords = this.findMatchingKeywords(candidate);

    // Days since last seen
    let daysSinceLastSeen: number | null = null;
    const previousEntries = Array.from(previousTrends.entries());
    for (const [normalizedTitle, lastSeen] of previousEntries) {
      if (areTitlesSimilar(candidate.title, normalizedTitle, 0.6)) {
        const days = Math.floor(
          (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastSeen === null || days < daysSinceLastSeen) {
          daysSinceLastSeen = days;
        }
      }
    }

    return {
      mentionCount24h,
      mentionCount7dAvg,
      sourceTypes,
      matchedKeywords,
      daysSinceLastSeen,
      aggregateScore: candidate.totalScore,
      aggregateComments: candidate.totalComments,
    };
  }

  /**
   * Find keywords that match the candidate's content
   */
  private findMatchingKeywords(candidate: TrendCandidate): string[] {
    const text = (
      candidate.title +
      " " +
      candidate.items.map((i) => i.content ?? "").join(" ")
    ).toLowerCase();

    const matched: string[] = [];
    for (const keyword of RELEVANCE_KEYWORDS) {
      if (text.includes(keyword.toLowerCase())) {
        matched.push(keyword);
      }
    }

    return matched;
  }

  /**
   * Calculate scores based on signals
   */
  private calculateScores(signals: TrendSignals): ScoreBreakdown {
    // 1. Velocity Score (0-30 points)
    // Growth rate: mentions_24h / max(mentions_7d_avg, 1) - 1
    const growthRate =
      signals.mentionCount24h / Math.max(signals.mentionCount7dAvg, 1) - 1;
    const velocity = Math.min(30, Math.max(0, Math.round(growthRate * 15)));

    // 2. Cross-Platform Score (0-25 points)
    // Count sources: count * 8, capped at 25
    const crossPlatform = Math.min(25, signals.sourceTypes.length * 8);

    // 3. Relevance Score (0-25 points)
    // Keyword matching: each match +5 points, capped at 25
    const relevance = Math.min(25, signals.matchedKeywords.length * 5);

    // 4. Novelty Score (0-20 points)
    // Days since last seen: days * 3, capped at 20
    // If never seen before, max novelty
    let novelty = 20;
    if (signals.daysSinceLastSeen !== null) {
      novelty = Math.min(20, Math.max(0, signals.daysSinceLastSeen * 3));
    }

    // Total
    const total = velocity + crossPlatform + relevance + novelty;

    return { velocity, crossPlatform, relevance, novelty, total };
  }

  /**
   * Save top trends to database
   */
  private async saveTrends(
    scoredCandidates: Array<{
      candidate: TrendCandidate;
      scores: ScoreBreakdown;
      signals: TrendSignals;
    }>
  ): Promise<number> {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    // Take top 10 candidates (more than 5 to allow for filtering)
    const topCandidates = scoredCandidates.slice(0, 10);

    // Filter out very low-quality trends (require at least 2 sources or decent score)
    const qualifiedCandidates = topCandidates.filter(
      (c) => c.candidate.sourceIds.size >= 2 || c.scores.total >= 30
    );

    // Take final top 5
    const finalCandidates = qualifiedCandidates.slice(0, 5);

    if (finalCandidates.length === 0) {
      return 0;
    }

    // Prepare trends for insertion
    const trendsToInsert: TrendInsert[] = finalCandidates.map(
      ({ candidate, scores, signals }, index) => {
        // Select best title from all items
        const bestTitle = selectBestTitle(
          candidate.items.map((i) => ({ title: i.title, score: i.score }))
        );

        // Deduplicate URLs
        const uniqueUrls = Array.from(new Set(candidate.urls)).slice(0, 10);

        return {
          title: bestTitle,
          slug: generateSlug(bestTitle, today),
          summary: null, // Will be filled by AI in US-5
          why_it_matters: null, // Will be filled by AI in US-5
          source_urls: uniqueUrls,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          signals: signals as any,
          velocity_score: scores.velocity,
          cross_platform_score: scores.crossPlatform,
          relevance_score: scores.relevance,
          novelty_score: scores.novelty,
          total_score: scores.total,
          source_count: candidate.sourceIds.size,
          raw_item_ids: candidate.items.map((i) => i.id),
          trend_date: today,
          rank: index + 1,
        };
      }
    );

    // Delete existing trends for today (re-scoring)
    await supabase.from("trends").delete().eq("trend_date", today);

    // Insert new trends
    const { error } = await supabase.from("trends").insert(trendsToInsert);

    if (error) {
      throw new Error(`Failed to save trends: ${error.message}`);
    }

    return trendsToInsert.length;
  }

  /**
   * Update job log entry
   */
  private async updateJobLog(
    jobId: string | undefined,
    status: "running" | "completed" | "failed",
    itemsProcessed: number,
    errorMessage?: string | null,
    durationMs?: number
  ): Promise<void> {
    if (!jobId) return;

    const supabase = await createClient();

    await supabase
      .from("job_logs")
      .update({
        status,
        items_processed: itemsProcessed,
        error_message: errorMessage ?? null,
        duration_ms: durationMs ?? null,
        completed_at: status !== "running" ? new Date().toISOString() : null,
      })
      .eq("id", jobId);
  }

  /**
   * Get today's top trends
   */
  async getDailyTrends(limit: number = 5): Promise<Array<{
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    whyItMatters: string | null;
    sourceUrls: string[];
    signals: TrendSignals;
    velocityScore: number;
    crossPlatformScore: number;
    relevanceScore: number;
    noveltyScore: number;
    totalScore: number;
    sourceCount: number;
    rank: number;
    trendDate: string;
  }>> {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("trends")
      .select("*")
      .eq("trend_date", today)
      .order("rank", { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch daily trends: ${error.message}`);
    }

    return (data ?? []).map((trend) => ({
      id: trend.id,
      title: trend.title,
      slug: trend.slug,
      summary: trend.summary,
      whyItMatters: trend.why_it_matters,
      sourceUrls: trend.source_urls,
      signals: trend.signals as unknown as TrendSignals,
      velocityScore: trend.velocity_score,
      crossPlatformScore: trend.cross_platform_score,
      relevanceScore: trend.relevance_score,
      noveltyScore: trend.novelty_score,
      totalScore: trend.total_score,
      sourceCount: trend.source_count,
      rank: trend.rank ?? 0,
      trendDate: trend.trend_date,
    }));
  }

  /**
   * Get a single trend by ID
   */
  async getTrendById(id: string): Promise<{
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    whyItMatters: string | null;
    sourceUrls: string[];
    signals: TrendSignals;
    velocityScore: number;
    crossPlatformScore: number;
    relevanceScore: number;
    noveltyScore: number;
    totalScore: number;
    sourceCount: number;
    rank: number;
    trendDate: string;
  } | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("trends")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch trend: ${error.message}`);
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      whyItMatters: data.why_it_matters,
      sourceUrls: data.source_urls,
      signals: data.signals as unknown as TrendSignals,
      velocityScore: data.velocity_score,
      crossPlatformScore: data.cross_platform_score,
      relevanceScore: data.relevance_score,
      noveltyScore: data.novelty_score,
      totalScore: data.total_score,
      sourceCount: data.source_count,
      rank: data.rank ?? 0,
      trendDate: data.trend_date,
    };
  }
}

// Export singleton instance
export const trendScoringService = new TrendScoringService();
