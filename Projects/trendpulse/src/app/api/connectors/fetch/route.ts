import { NextRequest, NextResponse } from "next/server";
import { connectorService } from "@/lib/connectors";

/**
 * POST /api/connectors/fetch
 * Triggers fetching from all active connectors
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
    const result = await connectorService.fetchAllSources();

    return NextResponse.json({
      success: true,
      data: {
        totalItems: result.totalItems,
        successCount: result.successCount,
        failureCount: result.failureCount,
        results: result.results,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch from connectors";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
