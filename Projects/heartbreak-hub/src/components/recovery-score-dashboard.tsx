"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Heart,
  Flame,
  Calendar,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { JournalEntry } from "@/lib/supabase/types";

// Mood emoji mapping for tooltip display
const MOOD_EMOJIS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "😢", label: "Very Sad" },
  2: { emoji: "😔", label: "Sad" },
  3: { emoji: "😞", label: "Down" },
  4: { emoji: "😕", label: "Uneasy" },
  5: { emoji: "😐", label: "Neutral" },
  6: { emoji: "🙂", label: "Okay" },
  7: { emoji: "😊", label: "Good" },
  8: { emoji: "😄", label: "Happy" },
  9: { emoji: "😁", label: "Very Happy" },
  10: { emoji: "🥳", label: "Ecstatic" },
};

interface RecoveryScoreDashboardProps {
  recoveryScore: number;
  currentDay: number;
  totalDays: number;
  streakCount: number;
  recentJournalEntries: JournalEntry[];
  showDaysCounter: boolean;
  daysSinceBreakup?: number;
  onToggleDaysCounter?: () => void;
}

export function RecoveryScoreDashboard({
  recoveryScore,
  currentDay,
  totalDays,
  streakCount,
  recentJournalEntries,
  showDaysCounter,
  daysSinceBreakup,
  onToggleDaysCounter,
}: RecoveryScoreDashboardProps) {
  // Get mood data for the last 7 entries (sorted by date ascending for chart)
  const moodData = recentJournalEntries
    .filter((entry) => entry.mood_score !== null)
    .slice(0, 7)
    .reverse();

  const progressPercentage = Math.round((currentDay / totalDays) * 100);

  return (
    <Card className="mb-6 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <TrendingUp className="h-5 w-5" />
          Recovery Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Row: Recovery Score and Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recovery Score - Prominent Display */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-6 w-6 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">
                Recovery Score
              </span>
            </div>
            <p className="text-5xl font-bold text-purple-600">{recoveryScore}</p>
            <p className="text-xs text-muted-foreground mt-1">points earned</p>
          </div>

          {/* Progress Bar with Day Counter */}
          <div className="flex flex-col justify-center p-4 bg-white rounded-xl border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Journey Progress
              </span>
              <span className="text-sm font-semibold text-purple-600">
                {currentDay}/{totalDays} days
              </span>
            </div>
            <div className="h-4 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {progressPercentage}% complete
            </p>
          </div>
        </div>

        {/* Middle Row: Streak and Days Since Breakup */}
        <div className="grid grid-cols-2 gap-4">
          {/* Streak Counter */}
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-teal-100 shadow-sm">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Flame className="h-6 w-6 text-teal-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-600">{streakCount}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>

          {/* Days Since Breakup (Optional) */}
          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-warm-100 shadow-sm">
            <div className="p-2 bg-warm-50 rounded-lg">
              <Calendar className="h-6 w-6 text-warm-500" />
            </div>
            <div className="flex-1">
              {showDaysCounter && daysSinceBreakup !== undefined ? (
                <>
                  <p className="text-2xl font-bold text-warm-600">
                    {daysSinceBreakup}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Days Since Breakup
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Counter hidden
                </p>
              )}
            </div>
            {onToggleDaysCounter && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onToggleDaysCounter}
                className="text-muted-foreground hover:text-foreground"
                title={showDaysCounter ? "Hide counter" : "Show counter"}
              >
                {showDaysCounter ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Row: Mini Mood Graph */}
        <div className="p-4 bg-white rounded-xl border border-purple-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Recent Mood Trend
            </span>
            <span className="text-xs text-muted-foreground">
              Last {moodData.length} journal entries
            </span>
          </div>
          {moodData.length > 0 ? (
            <MiniMoodGraph moodData={moodData} />
          ) : (
            <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
              No mood data yet. Start journaling to see your trend!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Mini Mood Graph Component (SVG-based)
function MiniMoodGraph({ moodData }: { moodData: JournalEntry[] }) {
  const width = 300;
  const height = 80;
  const padding = { top: 10, right: 20, bottom: 25, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate points
  const points = moodData.map((entry, index) => {
    const x = padding.left + (index / Math.max(moodData.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - ((entry.mood_score || 5) / 10) * chartHeight;
    return { x, y, mood: entry.mood_score || 5, date: entry.created_at };
  });

  // Create path for line
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  // Create path for gradient fill
  const areaPath =
    linePath +
    ` L ${points[points.length - 1]?.x || padding.left} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

  // Format date for display
  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Gradient definition */}
        <defs>
          <linearGradient id="moodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis labels */}
        <text
          x={padding.left - 5}
          y={padding.top + 3}
          textAnchor="end"
          className="fill-muted-foreground text-[8px]"
        >
          10
        </text>
        <text
          x={padding.left - 5}
          y={padding.top + chartHeight / 2 + 3}
          textAnchor="end"
          className="fill-muted-foreground text-[8px]"
        >
          5
        </text>
        <text
          x={padding.left - 5}
          y={height - padding.bottom + 3}
          textAnchor="end"
          className="fill-muted-foreground text-[8px]"
        >
          0
        </text>

        {/* Horizontal grid lines */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={width - padding.right}
          y2={padding.top}
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1={padding.left}
          y1={padding.top + chartHeight / 2}
          x2={width - padding.right}
          y2={padding.top + chartHeight / 2}
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        {/* Area fill */}
        {points.length > 1 && (
          <path d={areaPath} fill="url(#moodGradient)" />
        )}

        {/* Line */}
        {points.length > 1 && (
          <path
            d={linePath}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points with emoji tooltips */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#a855f7"
              stroke="white"
              strokeWidth="2"
            />
            {/* Show emoji on hover via title */}
            <title>
              {formatShortDate(point.date)}: {MOOD_EMOJIS[point.mood]?.label || "Unknown"} ({point.mood}/10)
            </title>
            {/* X-axis date labels (only first and last for clarity) */}
            {(index === 0 || index === points.length - 1) && (
              <text
                x={point.x}
                y={height - 5}
                textAnchor={index === 0 ? "start" : "end"}
                className="fill-muted-foreground text-[8px]"
              >
                {formatShortDate(point.date)}
              </text>
            )}
          </g>
        ))}

        {/* Single point case */}
        {points.length === 1 && (
          <g>
            <circle
              cx={padding.left + chartWidth / 2}
              cy={points[0].y}
              r="6"
              fill="#a855f7"
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={padding.left + chartWidth / 2}
              y={height - 5}
              textAnchor="middle"
              className="fill-muted-foreground text-[8px]"
            >
              {formatShortDate(points[0].date)}
            </text>
          </g>
        )}
      </svg>

      {/* Legend with current mood trend */}
      {moodData.length >= 2 && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs">
          {(() => {
            const firstMood = moodData[0]?.mood_score || 5;
            const lastMood = moodData[moodData.length - 1]?.mood_score || 5;
            const trend = lastMood - firstMood;
            if (trend > 0) {
              return (
                <span className="text-teal-600 flex items-center gap-1">
                  <span>↗</span> Mood improving
                </span>
              );
            } else if (trend < 0) {
              return (
                <span className="text-warm-600 flex items-center gap-1">
                  <span>↘</span> Mood dipping
                </span>
              );
            } else {
              return (
                <span className="text-muted-foreground flex items-center gap-1">
                  <span>→</span> Mood stable
                </span>
              );
            }
          })()}
        </div>
      )}
    </div>
  );
}
