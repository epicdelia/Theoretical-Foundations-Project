import { NextRequest, NextResponse } from "next/server";
import { trendScoringService } from "@/lib/trends";

/**
 * POST /api/trends/score
 * Triggers the trend scoring job
 * Can be called by cron jobs or manually
 */
export async function POST(request: NextRequest) {
  // Verify cron secret for automated calls
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow if no cron secret is set (dev mode) or if it matches
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const result = await trendScoringService.scoreTrends();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        trendsProcessed: result.trendsProcessed,
        trendsCreated: result.trendsCreated,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to score trends";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
