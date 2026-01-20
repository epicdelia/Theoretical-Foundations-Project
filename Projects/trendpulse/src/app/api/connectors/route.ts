import { NextResponse } from "next/server";
import { connectorService } from "@/lib/connectors";

/**
 * GET /api/connectors
 * Returns status information for all configured connectors
 */
export async function GET() {
  try {
    const statuses = await connectorService.getConnectorStatuses();
    const summary = await connectorService.getHealthSummary();

    return NextResponse.json({
      success: true,
      data: {
        connectors: statuses,
        summary,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch connector statuses";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
