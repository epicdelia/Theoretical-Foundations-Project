import { NextRequest, NextResponse } from "next/server";
import { trendScoringService } from "@/lib/trends";

/**
 * GET /api/trends/[id]
 * Returns a single trend with full score breakdown
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const trend = await trendScoringService.getTrendById(id);

    if (!trend) {
      return NextResponse.json(
        {
          success: false,
          error: "Trend not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: trend,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch trend";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
