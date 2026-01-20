import type { Milestone } from "@/lib/supabase/types";

export type MilestoneCriteriaType =
  | "first_journal"
  | "streak_days"
  | "week_completed"
  | "encouragement_sent"
  | "pathway_progress"
  | "pathway_completed";

export interface EarnedMilestone {
  milestone_id: string;
  earned_at: string;
}

export interface MilestoneWithStatus extends Milestone {
  earned: boolean;
  earned_at?: string;
}

export interface MilestoneCheckContext {
  journalCount: number;
  streakCount: number;
  currentDay: number;
  pathwayDuration: number;
  encouragementsSent: number;
  earnedMilestones: EarnedMilestone[];
}
