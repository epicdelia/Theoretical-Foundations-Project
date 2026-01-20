"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DimensionName } from "@/lib/supabase/database.types";

interface CompatibilityChartProps {
  dimensionScores: Record<DimensionName, number>;
}

const dimensionLabels: Record<DimensionName, string> = {
  values: "Values",
  goals: "Goals",
  communication: "Comm",
  lifestyle: "Life",
  finance: "Finance",
};

const dimensionOrder: DimensionName[] = [
  "values",
  "goals",
  "communication",
  "lifestyle",
  "finance",
];

export function CompatibilityChart({
  dimensionScores,
}: CompatibilityChartProps) {
  // Calculate positions for radar chart points
  const centerX = 100;
  const centerY = 100;
  const maxRadius = 80;
  const numPoints = 5;

  const getPoint = (index: number, score: number) => {
    const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2;
    const radius = (score / 100) * maxRadius;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  const getLabelPosition = (index: number) => {
    const angle = (index * 2 * Math.PI) / numPoints - Math.PI / 2;
    const radius = maxRadius + 20;
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  };

  // Generate polygon points for the chart
  const points = dimensionOrder.map((dim, index) =>
    getPoint(index, dimensionScores[dim])
  );
  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Generate grid lines (circles at 25%, 50%, 75%, 100%)
  const gridLevels = [25, 50, 75, 100];

  // Generate axis lines
  const axisLines = dimensionOrder.map((_, index) => {
    const point = getPoint(index, 100);
    return `M${centerX},${centerY} L${point.x},${point.y}`;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Compatibility Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-square">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Grid circles */}
            {gridLevels.map((level) => (
              <circle
                key={level}
                cx={centerX}
                cy={centerY}
                r={(level / 100) * maxRadius}
                fill="none"
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeWidth={1}
              />
            ))}

            {/* Axis lines */}
            {axisLines.map((d, index) => (
              <path
                key={index}
                d={d}
                stroke="currentColor"
                strokeOpacity={0.1}
                strokeWidth={1}
              />
            ))}

            {/* Data polygon - filled area */}
            <polygon
              points={polygonPoints}
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />

            {/* Data points */}
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={4}
                fill="hsl(var(--primary))"
              />
            ))}

            {/* Labels */}
            {dimensionOrder.map((dim, index) => {
              const pos = getLabelPosition(index);
              const score = dimensionScores[dim];
              return (
                <g key={dim}>
                  <text
                    x={pos.x}
                    y={pos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-[10px] font-medium"
                  >
                    {dimensionLabels[dim]}
                  </text>
                  <text
                    x={pos.x}
                    y={pos.y + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[9px]"
                  >
                    {score}%
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
