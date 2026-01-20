import type {
  ContentType,
  ContentAngle,
  PlatformType,
} from "@/lib/supabase/types";

export type { ContentType, ContentAngle, PlatformType };

/**
 * Trend data used for content generation
 */
export interface TrendForGeneration {
  id: string;
  title: string;
  summary: string | null;
  why_it_matters: string | null;
  source_urls: string[];
  signals: {
    mentionCount24h: number;
    sourceTypes: string[];
    matchedKeywords?: string[];
  };
}

/**
 * Request to generate content
 */
export interface ContentGenerationRequest {
  trend_id: string;
  content_type: ContentType;
  angle?: ContentAngle;
  voice_profile_id?: string;
}

/**
 * Generated content result
 */
export interface GeneratedContent {
  id: string;
  user_id: string;
  trend_id: string;
  voice_profile_id: string | null;
  content_type: ContentType;
  angle: ContentAngle | null;
  content: string;
  metadata: GeneratedContentMetadata;
  is_favorite: boolean;
  copied_at: string | null;
  exported_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Metadata stored with generated content
 */
export interface GeneratedContentMetadata {
  trend_title: string;
  source_urls: string[];
  generation_params?: {
    voice_profile_name?: string;
    platform?: PlatformType;
  };
}

/**
 * LinkedIn post structure
 */
export interface LinkedInPost {
  content: string;
  hashtags: string[];
  characterCount: number;
}

/**
 * Twitter thread structure
 */
export interface TwitterThread {
  hook: string;
  tweets: string[];
  totalTweets: number;
}

/**
 * Instagram Reel script structure (30-45 seconds)
 */
export interface InstagramReelScript {
  hook: string;
  body: string;
  cta: string;
  loop: string;
  estimatedDuration: number;
}

/**
 * Reply bank structure
 */
export interface ReplyBank {
  replies: SpicyReply[];
  trend_title: string;
}

export interface SpicyReply {
  reply: string;
  tone: "witty" | "bold" | "provocative" | "insightful" | "contrarian";
  characterCount: number;
}

/**
 * Content angle descriptions for prompts
 */
export const ANGLE_DESCRIPTIONS: Record<ContentAngle, string> = {
  hot_take:
    "A bold, contrarian opinion that challenges conventional wisdom. Be provocative but substantiated.",
  tutorial:
    "Educational, step-by-step breakdown. Focus on actionable takeaways and practical value.",
  founder_story:
    "Personal narrative connecting to the trend. Share lessons learned, mistakes made, or insights gained.",
  meme:
    "Humorous, relatable take using cultural references. Keep it light but insightful.",
  explainer:
    "Clear, accessible explanation for those unfamiliar with the topic. Break down complexity.",
};

/**
 * Platform-specific content guidelines
 */
export const PLATFORM_GUIDELINES: Record<
  ContentType,
  { maxLength: number; description: string }
> = {
  linkedin_post: {
    maxLength: 3000,
    description:
      "Long-form, professional content. Use line breaks for readability. Include a hook, value-packed body, and engagement question.",
  },
  twitter_thread: {
    maxLength: 280,
    description:
      "Each tweet max 280 chars. Hook tweet must grab attention. 5-8 tweets total. End with CTA.",
  },
  instagram_reel_script: {
    maxLength: 500,
    description:
      "30-45 second script. Strong hook (first 3 seconds), valuable body, clear CTA, and loop back to hook.",
  },
  reply: {
    maxLength: 280,
    description:
      "Short, punchy replies. Each should stand alone as a conversation starter.",
  },
};
