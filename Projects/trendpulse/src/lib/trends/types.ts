import type { Database } from "@/lib/supabase/types";

export type RawItem = Database["public"]["Tables"]["raw_items"]["Row"];
export type Trend = Database["public"]["Tables"]["trends"]["Row"];
export type TrendInsert = Database["public"]["Tables"]["trends"]["Insert"];
export type DataSource = Database["public"]["Tables"]["data_sources"]["Row"];

/**
 * Grouped raw items representing a potential trend
 */
export interface TrendCandidate {
  title: string;
  normalizedTitle: string;
  items: RawItem[];
  sourceIds: Set<string>;
  sourceTypes: Set<string>;
  urls: string[];
  totalScore: number;
  totalComments: number;
  earliestPublished: Date | null;
  latestPublished: Date | null;
}

/**
 * Scoring breakdown for a trend
 */
export interface ScoreBreakdown {
  velocity: number;
  crossPlatform: number;
  relevance: number;
  novelty: number;
  total: number;
}

/**
 * Signals stored with the trend
 */
export interface TrendSignals {
  mentionCount24h: number;
  mentionCount7dAvg: number;
  sourceTypes: string[];
  matchedKeywords: string[];
  daysSinceLastSeen: number | null;
  aggregateScore: number;
  aggregateComments: number;
}

/**
 * Result of the scoring job
 */
export interface ScoringResult {
  success: boolean;
  trendsProcessed: number;
  trendsCreated: number;
  error?: string;
}
