"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  DimensionName,
  QuizResponse,
} from "@/lib/supabase/database.types";

const DIMENSIONS: DimensionName[] = [
  "values",
  "goals",
  "communication",
  "lifestyle",
  "finance",
];

const COMPATIBILITY_THRESHOLD = 60;
const MIN_ANSWER_VALUE = 1;
const MAX_ANSWER_VALUE = 5;

type DimensionScores = {
  [key in DimensionName]: number;
};

interface CompatibilityResult {
  overallScore: number;
  dimensionScores: DimensionScores;
}

/**
 * Calculate similarity score between two answer values (1-5 scale)
 * Returns a score from 0-100 where:
 * - Same answer = 100
 * - 1 point difference = 75
 * - 2 point difference = 50
 * - 3 point difference = 25
 * - 4 point difference = 0
 */
function calculateAnswerSimilarity(
  answer1: number,
  answer2: number
): number {
  const maxDiff = MAX_ANSWER_VALUE - MIN_ANSWER_VALUE;
  const diff = Math.abs(answer1 - answer2);
  return Math.round(((maxDiff - diff) / maxDiff) * 100);
}

/**
 * Calculate per-dimension compatibility score between two users
 */
function calculateDimensionScore(
  user1Responses: QuizResponse[],
  user2Responses: QuizResponse[],
  dimension: DimensionName
): number {
  const user1DimResponses = user1Responses.filter(
    (r) => r.dimension === dimension
  );
  const user2DimResponses = user2Responses.filter(
    (r) => r.dimension === dimension
  );

  if (user1DimResponses.length === 0 || user2DimResponses.length === 0) {
    return 0;
  }

  // Create a map of user2's answers by question_id
  const user2AnswerMap = new Map<string, number>();
  for (const response of user2DimResponses) {
    user2AnswerMap.set(response.question_id, response.answer_value);
  }

  // Calculate similarity for each common question
  let totalScore = 0;
  let commonQuestions = 0;

  for (const user1Response of user1DimResponses) {
    const user2Answer = user2AnswerMap.get(user1Response.question_id);
    if (user2Answer !== undefined) {
      totalScore += calculateAnswerSimilarity(
        user1Response.answer_value,
        user2Answer
      );
      commonQuestions++;
    }
  }

  if (commonQuestions === 0) {
    return 0;
  }

  return Math.round(totalScore / commonQuestions);
}

/**
 * Calculate full compatibility between two users
 */
export async function calculateCompatibility(
  user1Id: string,
  user2Id: string
): Promise<CompatibilityResult | null> {
  const supabase = await createClient();

  // Fetch quiz responses for both users
  const [user1ResponsesResult, user2ResponsesResult, dimensionsResult] =
    await Promise.all([
      supabase
        .from("compatibility_quiz_responses")
        .select("*")
        .eq("user_id", user1Id),
      supabase
        .from("compatibility_quiz_responses")
        .select("*")
        .eq("user_id", user2Id),
      supabase.from("compatibility_dimensions").select("*"),
    ]);

  if (
    user1ResponsesResult.error ||
    user2ResponsesResult.error ||
    dimensionsResult.error
  ) {
    console.error("Error fetching data for compatibility calculation");
    return null;
  }

  const user1Responses = user1ResponsesResult.data;
  const user2Responses = user2ResponsesResult.data;
  const dimensions = dimensionsResult.data;

  // Check if both users have completed the quiz
  if (user1Responses.length === 0 || user2Responses.length === 0) {
    return null;
  }

  // Create weight map from dimensions
  const weightMap = new Map<string, number>();
  for (const dim of dimensions) {
    weightMap.set(dim.name, dim.weight);
  }

  // Calculate per-dimension scores
  const dimensionScores: DimensionScores = {
    values: 0,
    goals: 0,
    communication: 0,
    lifestyle: 0,
    finance: 0,
  };

  let weightedTotal = 0;
  let totalWeight = 0;

  for (const dimension of DIMENSIONS) {
    const score = calculateDimensionScore(
      user1Responses,
      user2Responses,
      dimension
    );
    dimensionScores[dimension] = score;

    const weight = weightMap.get(dimension) ?? 0.2;
    weightedTotal += score * weight;
    totalWeight += weight;
  }

  // Calculate overall weighted average
  const overallScore =
    totalWeight > 0 ? Math.round(weightedTotal / totalWeight) : 0;

  return {
    overallScore,
    dimensionScores,
  };
}

/**
 * Get candidate users for matching based on preferences
 */
async function getCandidateUsers(
  userId: string,
  userProfile: {
    age: number | null;
    gender: string | null;
    location: string | null;
  },
  userPreferences: {
    min_age: number;
    max_age: number;
    preferred_location: string | null;
  } | null
) {
  const supabase = await createClient();

  // Get users that the current user has blocked or been blocked by
  const { data: blocks } = await supabase
    .from("blocks")
    .select("blocker_id, blocked_id")
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

  const blockedUserIds = new Set<string>();
  if (blocks) {
    for (const block of blocks) {
      if (block.blocker_id === userId) {
        blockedUserIds.add(block.blocked_id);
      } else {
        blockedUserIds.add(block.blocker_id);
      }
    }
  }

  // Get existing matches to avoid recalculating
  const { data: existingMatches } = await supabase
    .from("matches")
    .select("user1_id, user2_id")
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  const matchedUserIds = new Set<string>();
  if (existingMatches) {
    for (const match of existingMatches) {
      if (match.user1_id === userId) {
        matchedUserIds.add(match.user2_id);
      } else {
        matchedUserIds.add(match.user1_id);
      }
    }
  }

  // Build query for candidate users
  let query = supabase
    .from("users_extended")
    .select("user_id, age, gender, location")
    .neq("user_id", userId)
    .eq("intent_verified", true)
    .not("age", "is", null)
    .not("gender", "is", null);

  // Apply age filter if user has preferences
  if (userPreferences) {
    query = query
      .gte("age", userPreferences.min_age)
      .lte("age", userPreferences.max_age);
  }

  // Apply location preference if set
  if (userPreferences?.preferred_location) {
    query = query.eq("location", userPreferences.preferred_location);
  }

  const { data: candidates, error } = await query;

  if (error || !candidates) {
    console.error("Error fetching candidate users:", error);
    return [];
  }

  // Filter out blocked users and already matched users
  // Also filter candidates who haven't completed quiz
  const filteredCandidates = candidates.filter(
    (c) => !blockedUserIds.has(c.user_id) && !matchedUserIds.has(c.user_id)
  );

  // Get candidate user preferences to check mutual compatibility
  const candidateIds = filteredCandidates.map((c) => c.user_id);
  if (candidateIds.length === 0) return [];

  const { data: candidatePrefs } = await supabase
    .from("user_preferences")
    .select("*")
    .in("user_id", candidateIds);

  const candidatePrefsMap = new Map(
    candidatePrefs?.map((p) => [p.user_id, p]) ?? []
  );

  // Filter by mutual preference matching
  return filteredCandidates.filter((candidate) => {
    const theirPrefs = candidatePrefsMap.get(candidate.user_id);

    // Check if current user fits their age preferences
    if (theirPrefs && userProfile.age) {
      if (
        userProfile.age < theirPrefs.min_age ||
        userProfile.age > theirPrefs.max_age
      ) {
        return false;
      }
    }

    // Check location preference match
    if (
      theirPrefs?.preferred_location &&
      userProfile.location &&
      theirPrefs.preferred_location !== userProfile.location
    ) {
      return false;
    }

    return true;
  });
}

/**
 * Store a match in the database
 */
async function storeMatch(
  user1Id: string,
  user2Id: string,
  compatibilityResult: CompatibilityResult
) {
  const supabase = await createClient();

  // Ensure user1_id < user2_id to satisfy the database constraint
  const [orderedUser1, orderedUser2] =
    user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  const { error } = await supabase.from("matches").upsert(
    {
      user1_id: orderedUser1,
      user2_id: orderedUser2,
      compatibility_score: compatibilityResult.overallScore,
      dimension_scores_json: compatibilityResult.dimensionScores,
      status: "pending",
    },
    { onConflict: "user1_id,user2_id" }
  );

  if (error) {
    console.error("Error storing match:", error);
    return false;
  }

  return true;
}

/**
 * Calculate matches for a user against all compatible users
 * Called when a user completes their quiz
 */
export async function calculateMatchesForUser(userId: string): Promise<{
  success: boolean;
  matchesCreated: number;
  error?: string;
}> {
  const supabase = await createClient();

  // Get user's profile
  const { data: userProfile, error: profileError } = await supabase
    .from("users_extended")
    .select("age, gender, location")
    .eq("user_id", userId)
    .single();

  if (profileError || !userProfile) {
    return {
      success: false,
      matchesCreated: 0,
      error: "User profile not found",
    };
  }

  // Get user's preferences
  const { data: userPreferences } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Check if user has completed the quiz (all 5 dimensions)
  const { data: userResponses } = await supabase
    .from("compatibility_quiz_responses")
    .select("dimension")
    .eq("user_id", userId);

  if (!userResponses || userResponses.length === 0) {
    return {
      success: false,
      matchesCreated: 0,
      error: "User has not completed the compatibility quiz",
    };
  }

  const completedDimensions = new Set(userResponses.map((r) => r.dimension));
  const hasCompletedQuiz = DIMENSIONS.every((d) => completedDimensions.has(d));

  if (!hasCompletedQuiz) {
    return {
      success: false,
      matchesCreated: 0,
      error: "User has not completed all quiz dimensions",
    };
  }

  // Get candidate users
  const candidates = await getCandidateUsers(
    userId,
    userProfile,
    userPreferences
  );

  let matchesCreated = 0;

  // Calculate compatibility with each candidate
  for (const candidate of candidates) {
    // Check if candidate has completed the quiz
    const { data: candidateResponses } = await supabase
      .from("compatibility_quiz_responses")
      .select("dimension")
      .eq("user_id", candidate.user_id);

    if (!candidateResponses || candidateResponses.length === 0) {
      continue;
    }

    const candidateCompletedDimensions = new Set(
      candidateResponses.map((r) => r.dimension)
    );
    const candidateHasCompletedQuiz = DIMENSIONS.every((d) =>
      candidateCompletedDimensions.has(d)
    );

    if (!candidateHasCompletedQuiz) {
      continue;
    }

    const compatibilityResult = await calculateCompatibility(
      userId,
      candidate.user_id
    );

    if (
      compatibilityResult &&
      compatibilityResult.overallScore >= COMPATIBILITY_THRESHOLD
    ) {
      const stored = await storeMatch(
        userId,
        candidate.user_id,
        compatibilityResult
      );
      if (stored) {
        matchesCreated++;
      }
    }
  }

  return {
    success: true,
    matchesCreated,
  };
}

/**
 * Trigger compatibility calculation when user completes their quiz
 * This is called from the preferences page (final onboarding step)
 */
export async function onQuizComplete(): Promise<{
  success: boolean;
  matchesCreated: number;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      matchesCreated: 0,
      error: "You must be logged in",
    };
  }

  return calculateMatchesForUser(user.id);
}
