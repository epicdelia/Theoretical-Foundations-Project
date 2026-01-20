import { NextResponse } from "next/server";
import { trendScoringService } from "@/lib/trends";

/**
 * GET /api/trends/daily
 * Returns today's top 5 trends with score breakdowns
 */
export async function GET() {
  try {
    const trends = await trendScoringService.getDailyTrends(5);

    return NextResponse.json({
      success: true,
      data: {
        date: new Date().toISOString().split("T")[0],
        trends,
        count: trends.length,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch daily trends";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
