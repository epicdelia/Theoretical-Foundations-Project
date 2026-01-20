import type { Milestone } from "@/lib/supabase/types";
import type {
  MilestoneCriteriaType,
  MilestoneCheckContext,
  EarnedMilestone,
  MilestoneWithStatus,
} from "./types";

// Milestone definitions matching the database seed data
export const MILESTONE_DEFINITIONS: Array<{
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  criteria_type: MilestoneCriteriaType;
  criteria_hint: string;
}> = [
  {
    id: "d4e5f6a7-b8c9-0123-defa-234567890123",
    name: "First Journal Entry",
    description:
      "Written your first journal entry. Expressing your feelings is a powerful step in healing.",
    icon: "book-open",
    points: 10,
    criteria_type: "first_journal",
    criteria_hint: "Write your first journal entry",
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-345678901234",
    name: "7-Day Streak",
    description: "Maintained a 7-day streak. Consistency is the key to recovery.",
    icon: "flame",
    points: 25,
    criteria_type: "streak_days",
    criteria_hint: "Complete 7 days in a row",
  },
  {
    id: "f6a7b8c9-d0e1-2345-fabc-456789012345",
    name: "Completed Week 1",
    description:
      "Completed your first week of the recovery journey. Every journey begins with a single step.",
    icon: "calendar-check",
    points: 50,
    criteria_type: "week_completed",
    criteria_hint: "Complete day 7 of your pathway",
  },
  {
    id: "a7b8c9d0-e1f2-3456-abcd-567890123456",
    name: "Shared Encouragement",
    description:
      "Sent your first encouragement to a fellow traveler. Healing together is more powerful.",
    icon: "heart-handshake",
    points: 20,
    criteria_type: "encouragement_sent",
    criteria_hint: "Send encouragement to a cohort member",
  },
  {
    id: "b8c9d0e1-f2a3-4567-bcde-678901234567",
    name: "Halfway There",
    description:
      "Reached the halfway point of your pathway. You are stronger than you know.",
    icon: "mountain",
    points: 75,
    criteria_type: "pathway_progress",
    criteria_hint: "Reach the halfway point of your pathway",
  },
  {
    id: "c9d0e1f2-a3b4-5678-cdef-789012345678",
    name: "Program Complete",
    description:
      "Completed an entire pathway. You have proven your resilience and commitment to growth.",
    icon: "trophy",
    points: 150,
    criteria_type: "pathway_completed",
    criteria_hint: "Complete your entire pathway",
  },
];

/**
 * Check if a specific milestone criteria is met
 */
export function checkMilestoneCriteria(
  criteriaType: MilestoneCriteriaType,
  context: MilestoneCheckContext
): boolean {
  switch (criteriaType) {
    case "first_journal":
      return context.journalCount >= 1;

    case "streak_days":
      return context.streakCount >= 7;

    case "week_completed":
      return context.currentDay > 7;

    case "encouragement_sent":
      return context.encouragementsSent >= 1;

    case "pathway_progress":
      return context.currentDay > context.pathwayDuration / 2;

    case "pathway_completed":
      return context.currentDay >= context.pathwayDuration;

    default:
      return false;
  }
}

/**
 * Check all milestones and return newly earned ones
 */
export function checkForNewMilestones(
  context: MilestoneCheckContext
): typeof MILESTONE_DEFINITIONS {
  const earnedIds = new Set(context.earnedMilestones.map((m) => m.milestone_id));

  return MILESTONE_DEFINITIONS.filter((milestone) => {
    // Skip if already earned
    if (earnedIds.has(milestone.id)) return false;

    // Check if criteria is now met
    return checkMilestoneCriteria(milestone.criteria_type, context);
  });
}

/**
 * Get all milestones with their earned status
 */
export function getMilestonesWithStatus(
  milestones: Milestone[],
  earnedMilestones: EarnedMilestone[]
): MilestoneWithStatus[] {
  const earnedMap = new Map(
    earnedMilestones.map((m) => [m.milestone_id, m.earned_at])
  );

  return milestones.map((milestone) => ({
    ...milestone,
    earned: earnedMap.has(milestone.id),
    earned_at: earnedMap.get(milestone.id),
  }));
}

/**
 * Calculate total recovery score from earned milestones
 */
export function calculateRecoveryScore(earnedMilestones: EarnedMilestone[]): number {
  const earnedIds = new Set(earnedMilestones.map((m) => m.milestone_id));

  return MILESTONE_DEFINITIONS.filter((m) => earnedIds.has(m.id)).reduce(
    (total, m) => total + m.points,
    0
  );
}

/**
 * Get criteria hint for a locked milestone
 */
export function getCriteriaHint(criteriaType: string): string {
  const milestone = MILESTONE_DEFINITIONS.find(
    (m) => m.criteria_type === criteriaType
  );
  return milestone?.criteria_hint || "Complete the required action";
}
