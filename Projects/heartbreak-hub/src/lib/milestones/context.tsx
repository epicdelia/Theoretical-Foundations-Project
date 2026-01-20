"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useToast } from "@/components/ui/toast";
import {
  checkForNewMilestones,
  MILESTONE_DEFINITIONS,
  calculateRecoveryScore,
} from "./service";
import type { EarnedMilestone, MilestoneCheckContext } from "./types";

interface MilestoneContextType {
  earnedMilestones: EarnedMilestone[];
  setEarnedMilestones: (milestones: EarnedMilestone[]) => void;
  checkAndAwardMilestones: (
    context: Omit<MilestoneCheckContext, "earnedMilestones">
  ) => EarnedMilestone[];
  totalRecoveryScore: number;
}

const MilestoneContext = createContext<MilestoneContextType | undefined>(
  undefined
);

export function MilestoneProvider({ children }: { children: ReactNode }) {
  const [earnedMilestones, setEarnedMilestones] = useState<EarnedMilestone[]>(
    []
  );
  const { addToast } = useToast();

  const checkAndAwardMilestones = useCallback(
    (context: Omit<MilestoneCheckContext, "earnedMilestones">) => {
      const fullContext: MilestoneCheckContext = {
        ...context,
        earnedMilestones,
      };

      const newMilestones = checkForNewMilestones(fullContext);
      const newEarnedMilestones: EarnedMilestone[] = [];

      newMilestones.forEach((milestone) => {
        const earned: EarnedMilestone = {
          milestone_id: milestone.id,
          earned_at: new Date().toISOString(),
        };
        newEarnedMilestones.push(earned);

        // Show toast notification
        addToast({
          title: `Milestone Earned: ${milestone.name}`,
          description: `+${milestone.points} recovery points`,
          variant: "milestone",
        });
      });

      if (newEarnedMilestones.length > 0) {
        setEarnedMilestones((prev) => [...prev, ...newEarnedMilestones]);
      }

      return newEarnedMilestones;
    },
    [earnedMilestones, addToast]
  );

  const totalRecoveryScore = calculateRecoveryScore(earnedMilestones);

  return (
    <MilestoneContext.Provider
      value={{
        earnedMilestones,
        setEarnedMilestones,
        checkAndAwardMilestones,
        totalRecoveryScore,
      }}
    >
      {children}
    </MilestoneContext.Provider>
  );
}

export function useMilestones() {
  const context = useContext(MilestoneContext);
  if (!context) {
    throw new Error("useMilestones must be used within a MilestoneProvider");
  }
  return context;
}

/**
 * Get milestone definition by ID
 */
export function getMilestoneById(id: string) {
  return MILESTONE_DEFINITIONS.find((m) => m.id === id);
}
