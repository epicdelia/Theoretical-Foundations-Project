"use client";

import {
  Heart,
  Target,
  MessageSquare,
  Home,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DimensionName } from "@/lib/supabase/database.types";

interface CompatibilityBreakdownProps {
  dimensionScores: Record<DimensionName, number>;
}

const dimensionConfig: Record<
  DimensionName,
  { label: string; icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  values: {
    label: "Values",
    icon: Heart,
    description: "Core beliefs, principles, and what matters most in life",
  },
  goals: {
    label: "Goals",
    icon: Target,
    description: "Life ambitions, career aspirations, and future plans",
  },
  communication: {
    label: "Communication",
    icon: MessageSquare,
    description: "How you express yourself and handle disagreements",
  },
  lifestyle: {
    label: "Lifestyle",
    icon: Home,
    description: "Daily habits, social preferences, and living style",
  },
  finance: {
    label: "Finance",
    icon: Wallet,
    description: "Money management, spending habits, and financial goals",
  },
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-orange-500";
};

const getScoreTextColor = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-orange-600";
};

export function CompatibilityBreakdown({
  dimensionScores,
}: CompatibilityBreakdownProps) {
  const sortedDimensions = Object.entries(dimensionScores).sort(
    ([, a], [, b]) => b - a
  ) as [DimensionName, number][];

  const strongAreas = sortedDimensions.filter(([, score]) => score >= 75);
  const growthAreas = sortedDimensions.filter(([, score]) => score < 60);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Compatibility Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dimension Scores */}
        <div className="space-y-4">
          {sortedDimensions.map(([dimension, score]) => {
            const config = dimensionConfig[dimension];
            const Icon = config.icon;
            return (
              <div key={dimension} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <span className={`font-bold ${getScoreTextColor(score)}`}>
                    {score}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getScoreColor(score)} transition-all`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Highlights Section */}
        {(strongAreas.length > 0 || growthAreas.length > 0) && (
          <div className="border-t pt-4 space-y-4">
            {strongAreas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 text-green-600 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  Strong Alignment
                </h4>
                <div className="flex flex-wrap gap-2">
                  {strongAreas.map(([dimension, score]) => (
                    <span
                      key={dimension}
                      className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200"
                    >
                      {dimensionConfig[dimension].label}: {score}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {growthAreas.length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 text-orange-600 mb-2">
                  <TrendingDown className="h-4 w-4" />
                  Areas to Explore
                </h4>
                <div className="flex flex-wrap gap-2">
                  {growthAreas.map(([dimension, score]) => (
                    <span
                      key={dimension}
                      className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-200"
                    >
                      {dimensionConfig[dimension].label}: {score}%
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  These are areas where you might have different perspectives.
                  This can lead to growth and learning together!
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
