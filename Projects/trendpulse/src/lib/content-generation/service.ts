import { createClient } from "@/lib/supabase/server";
import type { VoiceProfile } from "@/lib/voice/types";
import type {
  ContentGenerationRequest,
  GeneratedContent,
  TrendForGeneration,
  ContentType,
  GeneratedContentMetadata,
  LinkedInPost,
  TwitterThread,
  InstagramReelScript,
  ReplyBank,
} from "./types";
import {
  generateLinkedInPost,
  generateTwitterThread,
  generateInstagramReelScript,
  generateReplyBank,
  formatContentForStorage,
} from "./generators";

/**
 * Service for managing content generation
 */
class ContentGenerationService {
  /**
   * Generates content for a trend
   */
  async generateContent(
    userId: string,
    request: ContentGenerationRequest
  ): Promise<GeneratedContent> {
    const supabase = await createClient();

    // Fetch the trend
    const { data: trend, error: trendError } = await supabase
      .from("trends")
      .select("*")
      .eq("id", request.trend_id)
      .single();

    if (trendError || !trend) {
      throw new Error("Trend not found");
    }

    // Fetch voice profile if provided
    let voiceProfile: VoiceProfile | null = null;
    if (request.voice_profile_id) {
      const { data: profile, error: profileError } = await supabase
        .from("voice_profiles")
        .select("*")
        .eq("id", request.voice_profile_id)
        .eq("user_id", userId)
        .single();

      if (profileError) {
        throw new Error("Voice profile not found");
      }

      voiceProfile = profile as VoiceProfile;
    }

    // Prepare trend data for generation
    const trendForGeneration: TrendForGeneration = {
      id: trend.id,
      title: trend.title,
      summary: trend.summary,
      why_it_matters: trend.why_it_matters,
      source_urls: trend.source_urls || [],
      signals: {
        mentionCount24h: (trend.signals as Record<string, unknown>)?.mentionCount24h as number || 0,
        sourceTypes: (trend.signals as Record<string, unknown>)?.sourceTypes as string[] || [],
        matchedKeywords: (trend.signals as Record<string, unknown>)?.matchedKeywords as string[] || [],
      },
    };

    // Generate content based on type
    const angle = request.angle || "explainer";
    let generatedResult: LinkedInPost | TwitterThread | InstagramReelScript | ReplyBank;
    let formattedContent: string;

    switch (request.content_type) {
      case "linkedin_post":
        generatedResult = await generateLinkedInPost(
          trendForGeneration,
          angle,
          voiceProfile
        );
        formattedContent = formatContentForStorage("linkedin_post", generatedResult);
        break;
      case "twitter_thread":
        generatedResult = await generateTwitterThread(
          trendForGeneration,
          angle,
          voiceProfile
        );
        formattedContent = formatContentForStorage("twitter_thread", generatedResult);
        break;
      case "instagram_reel_script":
        generatedResult = await generateInstagramReelScript(
          trendForGeneration,
          angle,
          voiceProfile
        );
        formattedContent = formatContentForStorage("instagram_reel_script", generatedResult);
        break;
      case "reply":
        generatedResult = await generateReplyBank(trendForGeneration, voiceProfile);
        formattedContent = formatContentForStorage("reply", generatedResult);
        break;
      default:
        throw new Error(`Unsupported content type: ${request.content_type}`);
    }

    // Prepare metadata
    const metadata: GeneratedContentMetadata = {
      trend_title: trend.title,
      source_urls: trend.source_urls || [],
      generation_params: voiceProfile
        ? {
            voice_profile_name: voiceProfile.name,
            platform: voiceProfile.platform,
          }
        : undefined,
    };

    // Save to database
    const { data: savedContent, error: saveError } = await supabase
      .from("generated_content")
      .insert({
        user_id: userId,
        trend_id: request.trend_id,
        voice_profile_id: request.voice_profile_id || null,
        content_type: request.content_type,
        angle: request.angle || null,
        content: formattedContent,
        metadata,
        is_favorite: false,
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Failed to save content: ${saveError.message}`);
    }

    return savedContent as GeneratedContent;
  }

  /**
   * Gets previously generated content for a user
   */
  async getGeneratedContent(
    userId: string,
    options?: {
      trendId?: string;
      contentType?: ContentType;
      limit?: number;
    }
  ): Promise<GeneratedContent[]> {
    const supabase = await createClient();

    let query = supabase
      .from("generated_content")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (options?.trendId) {
      query = query.eq("trend_id", options.trendId);
    }

    if (options?.contentType) {
      query = query.eq("content_type", options.contentType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch content: ${error.message}`);
    }

    return (data || []) as GeneratedContent[];
  }

  /**
   * Gets a single generated content by ID
   */
  async getContentById(
    userId: string,
    contentId: string
  ): Promise<GeneratedContent | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("generated_content")
      .select("*")
      .eq("id", contentId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch content: ${error.message}`);
    }

    return data as GeneratedContent;
  }

  /**
   * Toggles favorite status for content
   */
  async toggleFavorite(
    userId: string,
    contentId: string
  ): Promise<GeneratedContent> {
    const supabase = await createClient();

    // Get current state
    const current = await this.getContentById(userId, contentId);
    if (!current) {
      throw new Error("Content not found");
    }

    const { data, error } = await supabase
      .from("generated_content")
      .update({ is_favorite: !current.is_favorite })
      .eq("id", contentId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to toggle favorite: ${error.message}`);
    }

    return data as GeneratedContent;
  }

  /**
   * Records when content is copied
   */
  async markCopied(userId: string, contentId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("generated_content")
      .update({ copied_at: new Date().toISOString() })
      .eq("id", contentId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to mark as copied: ${error.message}`);
    }
  }

  /**
   * Deletes generated content
   */
  async deleteContent(userId: string, contentId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("generated_content")
      .delete()
      .eq("id", contentId)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete content: ${error.message}`);
    }
  }
}

export const contentGenerationService = new ContentGenerationService();
