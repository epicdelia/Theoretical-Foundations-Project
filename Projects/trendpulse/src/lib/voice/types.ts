import type { PlatformType } from "@/lib/supabase/types";

export type { PlatformType };

export interface VoiceProfile {
  id: string;
  user_id: string;
  name: string;
  platform: PlatformType;
  sample_posts: string[];
  tone: string | null;
  structure_patterns: StructurePatterns;
  emoji_usage: string | null;
  common_phrases: string[];
  cta_style: string | null;
  average_length: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface StructurePatterns {
  opening_style?: string;
  paragraph_count?: number;
  uses_line_breaks?: boolean;
  uses_bullet_points?: boolean;
  uses_numbered_lists?: boolean;
  uses_hashtags?: boolean;
  hashtag_count?: number;
  uses_mentions?: boolean;
}

export interface VoiceAnalysis {
  tone: string;
  structure_patterns: StructurePatterns;
  emoji_usage: string;
  common_phrases: string[];
  cta_style: string;
  average_length: number;
}

export interface CreateVoiceProfileInput {
  name: string;
  platform: PlatformType;
  sample_posts: string[];
  is_default?: boolean;
}

export interface UpdateVoiceProfileInput {
  name?: string;
  platform?: PlatformType;
  sample_posts?: string[];
  is_default?: boolean;
}
