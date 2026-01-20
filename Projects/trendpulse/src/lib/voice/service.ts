import { createClient } from "@/lib/supabase/server";
import { analyzeVoice } from "./analyzer";
import type {
  VoiceProfile,
  CreateVoiceProfileInput,
  UpdateVoiceProfileInput,
  StructurePatterns,
} from "./types";

export class VoiceProfileService {
  /**
   * Get all voice profiles for a user
   */
  async getProfiles(userId: string): Promise<VoiceProfile[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch voice profiles: ${error.message}`);
    }

    return (data || []).map(this.mapToVoiceProfile);
  }

  /**
   * Get a single voice profile by ID
   */
  async getProfile(id: string, userId: string): Promise<VoiceProfile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch voice profile: ${error.message}`);
    }

    return this.mapToVoiceProfile(data);
  }

  /**
   * Get the default voice profile for a user and platform
   */
  async getDefaultProfile(
    userId: string,
    platform: string
  ): Promise<VoiceProfile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("voice_profiles")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", platform)
      .eq("is_default", true)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch default profile: ${error.message}`);
    }

    return this.mapToVoiceProfile(data);
  }

  /**
   * Create a new voice profile with pattern analysis
   */
  async createProfile(
    userId: string,
    input: CreateVoiceProfileInput
  ): Promise<VoiceProfile> {
    const supabase = await createClient();

    // Validate sample posts count
    if (input.sample_posts.length < 10) {
      throw new Error("At least 10 sample posts are required");
    }
    if (input.sample_posts.length > 30) {
      throw new Error("Maximum 30 sample posts allowed");
    }

    // Analyze the voice patterns
    const analysis = analyzeVoice(input.sample_posts);

    // If this is set as default, unset other defaults for the same platform
    if (input.is_default) {
      await supabase
        .from("voice_profiles")
        .update({ is_default: false })
        .eq("user_id", userId)
        .eq("platform", input.platform);
    }

    const { data, error } = await supabase
      .from("voice_profiles")
      .insert({
        user_id: userId,
        name: input.name,
        platform: input.platform,
        sample_posts: input.sample_posts,
        tone: analysis.tone,
        structure_patterns: analysis.structure_patterns,
        emoji_usage: analysis.emoji_usage,
        common_phrases: analysis.common_phrases,
        cta_style: analysis.cta_style,
        average_length: analysis.average_length,
        is_default: input.is_default ?? false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create voice profile: ${error.message}`);
    }

    return this.mapToVoiceProfile(data);
  }

  /**
   * Update a voice profile
   */
  async updateProfile(
    id: string,
    userId: string,
    input: UpdateVoiceProfileInput
  ): Promise<VoiceProfile> {
    const supabase = await createClient();

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.platform !== undefined) {
      updateData.platform = input.platform;
    }

    if (input.sample_posts !== undefined) {
      if (input.sample_posts.length < 10) {
        throw new Error("At least 10 sample posts are required");
      }
      if (input.sample_posts.length > 30) {
        throw new Error("Maximum 30 sample posts allowed");
      }

      // Re-analyze the voice patterns
      const analysis = analyzeVoice(input.sample_posts);
      updateData.sample_posts = input.sample_posts;
      updateData.tone = analysis.tone;
      updateData.structure_patterns = analysis.structure_patterns;
      updateData.emoji_usage = analysis.emoji_usage;
      updateData.common_phrases = analysis.common_phrases;
      updateData.cta_style = analysis.cta_style;
      updateData.average_length = analysis.average_length;
    }

    // Handle default flag
    if (input.is_default !== undefined) {
      updateData.is_default = input.is_default;

      // If setting as default, unset other defaults for the same platform
      if (input.is_default) {
        const profile = await this.getProfile(id, userId);
        if (profile) {
          const platform = input.platform ?? profile.platform;
          await supabase
            .from("voice_profiles")
            .update({ is_default: false })
            .eq("user_id", userId)
            .eq("platform", platform)
            .neq("id", id);
        }
      }
    }

    const { data, error } = await supabase
      .from("voice_profiles")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update voice profile: ${error.message}`);
    }

    return this.mapToVoiceProfile(data);
  }

  /**
   * Delete a voice profile
   */
  async deleteProfile(id: string, userId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("voice_profiles")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to delete voice profile: ${error.message}`);
    }
  }

  /**
   * Re-analyze an existing profile's sample posts
   */
  async reanalyzeProfile(id: string, userId: string): Promise<VoiceProfile> {
    const profile = await this.getProfile(id, userId);
    if (!profile) {
      throw new Error("Voice profile not found");
    }

    return this.updateProfile(id, userId, {
      sample_posts: profile.sample_posts,
    });
  }

  private mapToVoiceProfile(data: Record<string, unknown>): VoiceProfile {
    return {
      id: data.id as string,
      user_id: data.user_id as string,
      name: data.name as string,
      platform: data.platform as VoiceProfile["platform"],
      sample_posts: data.sample_posts as string[],
      tone: data.tone as string | null,
      structure_patterns: (data.structure_patterns as StructurePatterns) || {},
      emoji_usage: data.emoji_usage as string | null,
      common_phrases: (data.common_phrases as string[]) || [],
      cta_style: data.cta_style as string | null,
      average_length: data.average_length as number | null,
      is_default: data.is_default as boolean,
      created_at: data.created_at as string,
      updated_at: data.updated_at as string,
    };
  }
}

export const voiceProfileService = new VoiceProfileService();
