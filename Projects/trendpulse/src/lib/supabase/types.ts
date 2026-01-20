export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SourceType =
  | "hackernews"
  | "reddit"
  | "github_trending"
  | "rss"
  | "product_hunt";

export type ConnectorStatus = "active" | "inactive" | "error" | "rate_limited";

export type PlatformType = "linkedin" | "twitter" | "instagram";

export type ContentType =
  | "linkedin_post"
  | "twitter_thread"
  | "instagram_reel_script"
  | "reply";

export type ContentAngle =
  | "hot_take"
  | "tutorial"
  | "founder_story"
  | "meme"
  | "explainer";

export type JobType = "fetch_sources" | "score_trends" | "send_digest";

export type JobStatus = "running" | "completed" | "failed";

export type ExportType = "csv" | "notion" | "email";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          timezone: string;
          email_digest_enabled: boolean;
          email_digest_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          timezone?: string;
          email_digest_enabled?: boolean;
          email_digest_time?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          timezone?: string;
          email_digest_enabled?: boolean;
          email_digest_time?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      data_sources: {
        Row: {
          id: string;
          name: string;
          source_type: SourceType;
          config: Json;
          status: ConnectorStatus;
          last_fetch_at: string | null;
          last_error: string | null;
          rate_limit_reset_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          source_type: SourceType;
          config?: Json;
          status?: ConnectorStatus;
          last_fetch_at?: string | null;
          last_error?: string | null;
          rate_limit_reset_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          source_type?: SourceType;
          config?: Json;
          status?: ConnectorStatus;
          last_fetch_at?: string | null;
          last_error?: string | null;
          rate_limit_reset_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      raw_items: {
        Row: {
          id: string;
          source_id: string;
          external_id: string;
          title: string;
          url: string | null;
          content: string | null;
          author: string | null;
          score: number;
          comments_count: number;
          published_at: string | null;
          metadata: Json;
          fetched_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          external_id: string;
          title: string;
          url?: string | null;
          content?: string | null;
          author?: string | null;
          score?: number;
          comments_count?: number;
          published_at?: string | null;
          metadata?: Json;
          fetched_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_id?: string;
          external_id?: string;
          title?: string;
          url?: string | null;
          content?: string | null;
          author?: string | null;
          score?: number;
          comments_count?: number;
          published_at?: string | null;
          metadata?: Json;
          fetched_at?: string;
          created_at?: string;
        };
      };
      trends: {
        Row: {
          id: string;
          title: string;
          slug: string;
          summary: string | null;
          why_it_matters: string | null;
          source_urls: string[];
          signals: Json;
          velocity_score: number;
          cross_platform_score: number;
          relevance_score: number;
          novelty_score: number;
          total_score: number;
          source_count: number;
          raw_item_ids: string[];
          trend_date: string;
          rank: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          summary?: string | null;
          why_it_matters?: string | null;
          source_urls?: string[];
          signals?: Json;
          velocity_score?: number;
          cross_platform_score?: number;
          relevance_score?: number;
          novelty_score?: number;
          total_score?: number;
          source_count?: number;
          raw_item_ids?: string[];
          trend_date: string;
          rank?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          summary?: string | null;
          why_it_matters?: string | null;
          source_urls?: string[];
          signals?: Json;
          velocity_score?: number;
          cross_platform_score?: number;
          relevance_score?: number;
          novelty_score?: number;
          total_score?: number;
          source_count?: number;
          raw_item_ids?: string[];
          trend_date?: string;
          rank?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      voice_profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          platform: PlatformType;
          sample_posts: string[];
          tone: string | null;
          structure_patterns: Json;
          emoji_usage: string | null;
          common_phrases: string[];
          cta_style: string | null;
          average_length: number | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          platform: PlatformType;
          sample_posts: string[];
          tone?: string | null;
          structure_patterns?: Json;
          emoji_usage?: string | null;
          common_phrases?: string[];
          cta_style?: string | null;
          average_length?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          platform?: PlatformType;
          sample_posts?: string[];
          tone?: string | null;
          structure_patterns?: Json;
          emoji_usage?: string | null;
          common_phrases?: string[];
          cta_style?: string | null;
          average_length?: number | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      generated_content: {
        Row: {
          id: string;
          user_id: string;
          trend_id: string;
          voice_profile_id: string | null;
          content_type: ContentType;
          angle: ContentAngle | null;
          content: string;
          metadata: Json;
          is_favorite: boolean;
          copied_at: string | null;
          exported_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trend_id: string;
          voice_profile_id?: string | null;
          content_type: ContentType;
          angle?: ContentAngle | null;
          content: string;
          metadata?: Json;
          is_favorite?: boolean;
          copied_at?: string | null;
          exported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          trend_id?: string;
          voice_profile_id?: string | null;
          content_type?: ContentType;
          angle?: ContentAngle | null;
          content?: string;
          metadata?: Json;
          is_favorite?: boolean;
          copied_at?: string | null;
          exported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_logs: {
        Row: {
          id: string;
          job_type: JobType;
          status: JobStatus;
          started_at: string;
          completed_at: string | null;
          duration_ms: number | null;
          items_processed: number;
          error_message: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          job_type: JobType;
          status: JobStatus;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          items_processed?: number;
          error_message?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          job_type?: JobType;
          status?: JobStatus;
          started_at?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          items_processed?: number;
          error_message?: string | null;
          metadata?: Json;
        };
      };
      exports: {
        Row: {
          id: string;
          user_id: string;
          export_type: ExportType;
          trend_date: string;
          file_url: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          export_type: ExportType;
          trend_date: string;
          file_url?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          export_type?: ExportType;
          trend_date?: string;
          file_url?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
  };
}
