// Compatibility Algorithm for Harmonic Match
// Calculates compatibility scores between users based on:
// - Music taste (40% weight): genre overlap, audio feature similarity, artist matches
// - Conflict style (30% weight): complementary styles
// - Personality (30% weight): Big Five pattern compatibility

"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  TopArtistJson,
  AudioFeaturesAvgJson,
  ConflictStyle,
  ConflictAssessmentJson,
  BigFiveScoresJson,
  MusicProfile,
  ConflictStyleRecord,
  PersonalityAssessment,
  UserProfile,
  CompatibilityScoreInsert,
} from "@/lib/database.types";

// ============================================================================
// SCORE WEIGHTS
// ============================================================================

const WEIGHTS = {
  music: 0.4,
  conflict: 0.3,
  personality: 0.3,
} as const;

// ============================================================================
// MUSIC SCORE CALCULATION (40% of overall)
// ============================================================================

function calculateGenreOverlap(genres1: string[], genres2: string[]): number {
  if (genres1.length === 0 || genres2.length === 0) return 0;

  const set1 = new Set(genres1);
  const set2 = new Set(genres2);
  const intersection = [...set1].filter((g) => set2.has(g)).length;
  const union = new Set([...genres1, ...genres2]).size;

  // Jaccard similarity coefficient * 100
  return (intersection / union) * 100;
}

function calculateArtistOverlap(artists1: TopArtistJson[], artists2: TopArtistJson[]): number {
  if (artists1.length === 0 || artists2.length === 0) return 0;

  const ids1 = new Set(artists1.map((a) => a.id));
  const ids2 = new Set(artists2.map((a) => a.id));
  const intersection = [...ids1].filter((id) => ids2.has(id)).length;

  // Weighted by position - shared artists near top of lists worth more
  let positionScore = 0;
  let maxPossibleScore = 0;

  artists1.forEach((artist, idx1) => {
    const idx2 = artists2.findIndex((a) => a.id === artist.id);
    const weight1 = artists1.length - idx1;
    maxPossibleScore += weight1;

    if (idx2 !== -1) {
      const weight2 = artists2.length - idx2;
      positionScore += (weight1 + weight2) / 2;
    }
  });

  const overlapBonus = (intersection / Math.max(ids1.size, ids2.size)) * 50;
  const positionBonus = maxPossibleScore > 0 ? (positionScore / maxPossibleScore) * 50 : 0;

  return Math.min(overlapBonus + positionBonus, 100);
}

function calculateAudioFeatureSimilarity(
  features1: AudioFeaturesAvgJson,
  features2: AudioFeaturesAvgJson
): number {
  // Key audio features for compatibility (normalized 0-1)
  const compareFeatures: (keyof AudioFeaturesAvgJson)[] = [
    "acousticness",
    "danceability",
    "energy",
    "instrumentalness",
    "valence",
    "tempo",
  ];

  let totalDiff = 0;
  let featureCount = 0;

  for (const feature of compareFeatures) {
    const val1 = features1[feature];
    const val2 = features2[feature];

    if (val1 !== undefined && val2 !== undefined) {
      // Tempo needs normalization (typically 60-200 BPM)
      if (feature === "tempo") {
        const normalizedDiff = Math.abs(val1 - val2) / 140; // 140 = typical BPM range
        totalDiff += Math.min(normalizedDiff, 1);
      } else {
        // Other features are already 0-1
        totalDiff += Math.abs(val1 - val2);
      }
      featureCount++;
    }
  }

  if (featureCount === 0) return 50; // Neutral score if no features

  // Lower difference = higher similarity
  const avgDiff = totalDiff / featureCount;
  return (1 - avgDiff) * 100;
}

export function calculateMusicScore(
  profile1: MusicProfile,
  profile2: MusicProfile
): number {
  const genreScore = calculateGenreOverlap(
    profile1.top_genres_json,
    profile2.top_genres_json
  );

  const artistScore = calculateArtistOverlap(
    profile1.top_artists_json,
    profile2.top_artists_json
  );

  const audioScore = calculateAudioFeatureSimilarity(
    profile1.audio_features_avg_json,
    profile2.audio_features_avg_json
  );

  // Weight: genres 40%, artists 30%, audio features 30%
  return Math.round(genreScore * 0.4 + artistScore * 0.3 + audioScore * 0.3);
}

// ============================================================================
// CONFLICT SCORE CALCULATION (30% of overall)
// ============================================================================

// Compatibility matrix based on Thomas-Kilmann model
// Higher scores indicate better complementary styles
const CONFLICT_COMPATIBILITY: Record<ConflictStyle, Record<ConflictStyle, number>> = {
  collaborating: {
    collaborating: 95, // Both value working together
    compromising: 85, // Good balance
    accommodating: 80, // Collaborator can help them voice needs
    avoiding: 60, // May frustrate collaborator
    competing: 50, // Potential tension but can balance
  },
  compromising: {
    collaborating: 85,
    compromising: 80, // Both flexible
    accommodating: 75, // Works well
    avoiding: 55, // May leave issues unresolved
    competing: 60, // Can find middle ground
  },
  accommodating: {
    collaborating: 80,
    compromising: 75,
    accommodating: 65, // Neither may address real issues
    avoiding: 50, // Low engagement
    competing: 70, // Complementary - one gives, one takes
  },
  avoiding: {
    collaborating: 60,
    compromising: 55,
    accommodating: 50,
    avoiding: 40, // Both avoid - issues fester
    competing: 45, // One avoids conflict, one seeks it
  },
  competing: {
    collaborating: 50,
    compromising: 60,
    accommodating: 70, // Complementary styles
    avoiding: 45,
    competing: 35, // Both competitive - high friction
  },
};

export function calculateConflictScore(
  style1: ConflictStyleRecord,
  style2: ConflictStyleRecord
): number {
  const primary1 = style1.primary_style;
  const primary2 = style2.primary_style;
  const secondary1 = style1.secondary_style;
  const secondary2 = style2.secondary_style;

  // Primary style compatibility (60% weight)
  const primaryScore = CONFLICT_COMPATIBILITY[primary1][primary2];

  // Secondary style compatibility (40% weight) if both have secondary
  let secondaryScore = primaryScore; // Default to primary if no secondary
  if (secondary1 && secondary2) {
    secondaryScore = CONFLICT_COMPATIBILITY[secondary1][secondary2];
  } else if (secondary1) {
    secondaryScore = CONFLICT_COMPATIBILITY[secondary1][primary2];
  } else if (secondary2) {
    secondaryScore = CONFLICT_COMPATIBILITY[primary1][secondary2];
  }

  // Assessment score similarity bonus (up to 10 points)
  // Users with similar overall profiles may understand each other better
  let assessmentBonus = 0;
  if (style1.assessment_json && style2.assessment_json) {
    const scores1 = style1.assessment_json;
    const scores2 = style2.assessment_json;

    const styleKeys: (keyof Omit<ConflictAssessmentJson, "completed_at">)[] = [
      "competing_score",
      "collaborating_score",
      "compromising_score",
      "avoiding_score",
      "accommodating_score",
    ];

    let totalDiff = 0;
    for (const key of styleKeys) {
      totalDiff += Math.abs((scores1[key] as number) - (scores2[key] as number));
    }

    // Max possible diff is 100 (if all scores are opposite extremes)
    // Lower diff = higher bonus
    const avgDiff = totalDiff / styleKeys.length;
    assessmentBonus = Math.max(0, 10 - avgDiff / 2);
  }

  return Math.round(primaryScore * 0.6 + secondaryScore * 0.4 + assessmentBonus);
}

// ============================================================================
// PERSONALITY SCORE CALCULATION (30% of overall)
// ============================================================================

// Big Five compatibility - research suggests some similarity and some complementarity work best
const BIG_FIVE_WEIGHTS: Record<keyof BigFiveScoresJson, { similarity: number; threshold: number }> =
  {
    openness: { similarity: 0.8, threshold: 25 }, // Similar openness works well
    conscientiousness: { similarity: 0.7, threshold: 30 }, // Some flexibility okay
    extraversion: { similarity: 0.5, threshold: 35 }, // Complementary can work (intro + extro)
    agreeableness: { similarity: 0.9, threshold: 20 }, // Both should be agreeable
    neuroticism: { similarity: 0.6, threshold: 30 }, // Lower for both is better, but not critical
  };

export function calculatePersonalityScore(
  personality1: PersonalityAssessment,
  personality2: PersonalityAssessment
): number {
  const scores1 = personality1.scores_json as BigFiveScoresJson;
  const scores2 = personality2.scores_json as BigFiveScoresJson;

  let totalScore = 0;
  let totalWeight = 0;

  for (const trait of Object.keys(BIG_FIVE_WEIGHTS) as (keyof BigFiveScoresJson)[]) {
    const val1 = scores1[trait];
    const val2 = scores2[trait];

    if (val1 === undefined || val2 === undefined) continue;

    const config = BIG_FIVE_WEIGHTS[trait];
    const diff = Math.abs(val1 - val2);

    // Score based on similarity preference and threshold
    let traitScore: number;
    if (diff <= config.threshold) {
      // Within comfortable difference - high score
      traitScore = 100 - (diff / config.threshold) * 20;
    } else {
      // Outside threshold - score decreases faster
      traitScore = Math.max(0, 80 - ((diff - config.threshold) / (100 - config.threshold)) * 80);
    }

    // Apply similarity weight - higher weight means similarity matters more
    const weight = config.similarity;
    totalScore += traitScore * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 50; // Neutral if no traits

  // Bonus for both having low neuroticism (emotionally stable)
  let stabilityBonus = 0;
  if (scores1.neuroticism !== undefined && scores2.neuroticism !== undefined) {
    const avgNeuroticism = (scores1.neuroticism + scores2.neuroticism) / 2;
    if (avgNeuroticism < 40) {
      stabilityBonus = (40 - avgNeuroticism) / 4; // Up to 10 points bonus
    }
  }

  return Math.round(Math.min(totalScore / totalWeight + stabilityBonus, 100));
}

// ============================================================================
// OVERALL COMPATIBILITY CALCULATION
// ============================================================================

export interface CompatibilityResult {
  musicScore: number;
  conflictScore: number;
  personalityScore: number;
  overallScore: number;
}

export function calculateOverallCompatibility(
  musicScore: number,
  conflictScore: number,
  personalityScore: number
): number {
  return Math.round(
    musicScore * WEIGHTS.music +
      conflictScore * WEIGHTS.conflict +
      personalityScore * WEIGHTS.personality
  );
}

// ============================================================================
// USER DATA FETCHING
// ============================================================================

interface UserCompatibilityData {
  userId: string;
  userProfile: UserProfile;
  musicProfile: MusicProfile;
  conflictStyle: ConflictStyleRecord;
  personality: PersonalityAssessment;
}

async function fetchUserCompatibilityData(
  userId: string
): Promise<UserCompatibilityData | null> {
  const supabase = await createClient();

  // Fetch all required data in parallel
  const [userProfileRes, musicProfileRes, conflictStyleRes, personalityRes] =
    await Promise.all([
      supabase.from("user_profiles").select("*").eq("user_id", userId).single(),
      supabase.from("music_profiles").select("*").eq("user_id", userId).single(),
      supabase.from("conflict_styles").select("*").eq("user_id", userId).single(),
      supabase
        .from("personality_assessments")
        .select("*")
        .eq("user_id", userId)
        .eq("framework", "big_five")
        .single(),
    ]);

  // All data must exist for compatibility calculation
  if (
    userProfileRes.error ||
    musicProfileRes.error ||
    conflictStyleRes.error ||
    personalityRes.error
  ) {
    return null;
  }

  return {
    userId,
    userProfile: userProfileRes.data as UserProfile,
    musicProfile: musicProfileRes.data as MusicProfile,
    conflictStyle: conflictStyleRes.data as ConflictStyleRecord,
    personality: personalityRes.data as PersonalityAssessment,
  };
}

// ============================================================================
// MAIN COMPATIBILITY CALCULATION FUNCTIONS
// ============================================================================

export async function calculateCompatibilityBetweenUsers(
  userId1: string,
  userId2: string
): Promise<CompatibilityResult | null> {
  const [user1Data, user2Data] = await Promise.all([
    fetchUserCompatibilityData(userId1),
    fetchUserCompatibilityData(userId2),
  ]);

  if (!user1Data || !user2Data) {
    return null;
  }

  const musicScore = calculateMusicScore(user1Data.musicProfile, user2Data.musicProfile);
  const conflictScore = calculateConflictScore(
    user1Data.conflictStyle,
    user2Data.conflictStyle
  );
  const personalityScore = calculatePersonalityScore(
    user1Data.personality,
    user2Data.personality
  );
  const overallScore = calculateOverallCompatibility(musicScore, conflictScore, personalityScore);

  return {
    musicScore,
    conflictScore,
    personalityScore,
    overallScore,
  };
}

export async function calculateAndStoreCompatibility(
  userId1: string,
  userId2: string
): Promise<CompatibilityResult | null> {
  const result = await calculateCompatibilityBetweenUsers(userId1, userId2);

  if (!result) return null;

  const supabase = await createClient();

  // Ensure user ordering (user1_id < user2_id)
  const [orderedUser1, orderedUser2] =
    userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  const scoreData: CompatibilityScoreInsert = {
    user1_id: orderedUser1,
    user2_id: orderedUser2,
    music_score: result.musicScore,
    conflict_score: result.conflictScore,
    personality_score: result.personalityScore,
    overall_score: result.overallScore,
  };

  // Upsert to handle updates
  await supabase.from("compatibility_scores").upsert(scoreData, {
    onConflict: "user1_id,user2_id",
  });

  return result;
}

export async function calculateCompatibilityForUser(userId: string): Promise<number> {
  const supabase = await createClient();

  // Fetch current user's data first to check they have complete profile
  const userData = await fetchUserCompatibilityData(userId);
  if (!userData) {
    return 0; // User doesn't have complete profile
  }

  // Fetch all other users with complete profiles
  // We need users who have: user_profile, music_profile, conflict_style, and big_five personality
  const { data: userProfiles } = await supabase
    .from("user_profiles")
    .select("user_id")
    .neq("user_id", userId);

  if (!userProfiles || userProfiles.length === 0) {
    return 0;
  }

  let calculatedCount = 0;

  // Calculate compatibility with each potential match
  for (const profile of userProfiles) {
    const otherUserId = profile.user_id;

    // Check if other user has complete profile
    const otherUserData = await fetchUserCompatibilityData(otherUserId);
    if (!otherUserData) continue;

    // Calculate and store compatibility
    const result = await calculateAndStoreCompatibility(userId, otherUserId);
    if (result) {
      calculatedCount++;
    }
  }

  return calculatedCount;
}

export async function getCompatibilityScore(
  userId1: string,
  userId2: string
): Promise<CompatibilityResult | null> {
  const supabase = await createClient();

  // Ensure correct ordering for lookup
  const [orderedUser1, orderedUser2] =
    userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

  const { data, error } = await supabase
    .from("compatibility_scores")
    .select("*")
    .eq("user1_id", orderedUser1)
    .eq("user2_id", orderedUser2)
    .single();

  if (error || !data) {
    // If not found, calculate on the fly
    return calculateCompatibilityBetweenUsers(userId1, userId2);
  }

  return {
    musicScore: data.music_score ?? 0,
    conflictScore: data.conflict_score ?? 0,
    personalityScore: data.personality_score ?? 0,
    overallScore: data.overall_score ?? 0,
  };
}

export async function getTopMatches(
  userId: string,
  limit: number = 10
): Promise<Array<{ userId: string; compatibility: CompatibilityResult }>> {
  const supabase = await createClient();

  // Fetch scores where user is either user1 or user2
  const { data: scores } = await supabase
    .from("compatibility_scores")
    .select("*")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order("overall_score", { ascending: false })
    .limit(limit);

  if (!scores) return [];

  return scores.map((score) => ({
    userId: score.user1_id === userId ? score.user2_id : score.user1_id,
    compatibility: {
      musicScore: score.music_score ?? 0,
      conflictScore: score.conflict_score ?? 0,
      personalityScore: score.personality_score ?? 0,
      overallScore: score.overall_score ?? 0,
    },
  }));
}
