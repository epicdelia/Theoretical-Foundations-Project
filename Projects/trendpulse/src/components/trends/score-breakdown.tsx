"use client";

import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Zap, Globe, Target, Sparkles } from "lucide-react";

interface ScoreBreakdownProps {
  velocity: number;
  crossPlatform: number;
  relevance: number;
  novelty: number;
  total: number;
  compact?: boolean;
}

interface ScoreItemProps {
  label: string;
  value: number;
  max: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

function ScoreItem({ label, value, max, icon, color, description }: ScoreItemProps) {
  const percentage = (value / max) * 100;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={`flex-shrink-0 ${color}`}>{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium truncate">{label}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {value}/{max}
                </span>
              </div>
              <Progress value={percentage} className="h-1.5" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ScoreBreakdown({
  velocity,
  crossPlatform,
  relevance,
  novelty,
  total,
  compact = false,
}: ScoreBreakdownProps) {
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-sm">
              <div className="flex items-center gap-0.5">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span>{velocity}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Globe className="h-3 w-3 text-blue-500" />
                <span>{crossPlatform}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Target className="h-3 w-3 text-green-500" />
                <span>{relevance}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Sparkles className="h-3 w-3 text-purple-500" />
                <span>{novelty}</span>
              </div>
              <span className="font-semibold ml-1">= {total}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <p>Velocity: {velocity}/30 (growth rate)</p>
              <p>Cross-platform: {crossPlatform}/25 (sources)</p>
              <p>Relevance: {relevance}/25 (keywords)</p>
              <p>Novelty: {novelty}/20 (freshness)</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Score Breakdown</span>
        <span className="text-lg font-bold">{total}/100</span>
      </div>

      <div className="space-y-2">
        <ScoreItem
          label="Velocity"
          value={velocity}
          max={30}
          icon={<Zap className="h-4 w-4" />}
          color="text-yellow-500"
          description="Growth rate: how fast this topic is trending"
        />

        <ScoreItem
          label="Cross-Platform"
          value={crossPlatform}
          max={25}
          icon={<Globe className="h-4 w-4" />}
          color="text-blue-500"
          description="Number of different sources mentioning this topic"
        />

        <ScoreItem
          label="Relevance"
          value={relevance}
          max={25}
          icon={<Target className="h-4 w-4" />}
          color="text-green-500"
          description="Match with tech/AI keywords"
        />

        <ScoreItem
          label="Novelty"
          value={novelty}
          max={20}
          icon={<Sparkles className="h-4 w-4" />}
          color="text-purple-500"
          description="How new or fresh this topic is"
        />
      </div>
    </div>
  );
}
