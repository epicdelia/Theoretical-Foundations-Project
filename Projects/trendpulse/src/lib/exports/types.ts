import type { Database, ExportType } from "@/lib/supabase/types";

export type { ExportType };

export type Export = Database["public"]["Tables"]["exports"]["Row"];
export type ExportInsert = Database["public"]["Tables"]["exports"]["Insert"];

/**
 * Data structure for CSV export
 */
export interface CSVExportData {
  trends: TrendExportRow[];
  content: ContentExportRow[];
}

export interface TrendExportRow {
  rank: number;
  title: string;
  summary: string;
  why_it_matters: string;
  total_score: number;
  velocity_score: number;
  cross_platform_score: number;
  relevance_score: number;
  novelty_score: number;
  source_count: number;
  source_urls: string;
  trend_date: string;
}

export interface ContentExportRow {
  trend_title: string;
  content_type: string;
  angle: string;
  content: string;
  source_urls: string;
  created_at: string;
}

/**
 * Notion export configuration
 */
export interface NotionExportConfig {
  accessToken: string;
  databaseId: string;
}

export interface NotionPageProperties {
  title: string;
  summary: string;
  why_it_matters: string;
  score: number;
  source_urls: string[];
  trend_date: string;
  rank: number;
}

/**
 * Email digest configuration
 */
export interface EmailDigestConfig {
  recipientEmail: string;
  recipientName?: string;
  timezone: string;
}

export interface EmailDigestData {
  date: string;
  trends: EmailTrendSummary[];
  generatedContent?: EmailContentSummary[];
}

export interface EmailTrendSummary {
  rank: number;
  title: string;
  summary: string;
  why_it_matters: string;
  score: number;
  sourceUrls: string[];
}

export interface EmailContentSummary {
  trendTitle: string;
  contentType: string;
  preview: string;
}

/**
 * Plain text export for Buffer/Metricool
 */
export interface PlainTextExportOptions {
  includeSources: boolean;
  includeHashtags: boolean;
  platform: "buffer" | "metricool" | "generic";
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  exportId?: string;
  fileUrl?: string;
  data?: string;
  error?: string;
}
