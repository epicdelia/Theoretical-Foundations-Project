import { NextRequest, NextResponse } from "next/server";
import { connectorService } from "@/lib/connectors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/connectors/[id]
 * Get status for a specific connector
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const source = await connectorService.getSource(id);

    if (!source) {
      return NextResponse.json(
        { success: false, error: "Connector not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: source,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch connector";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/connectors/[id]
 * Trigger fetch for a specific connector
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const result = await connectorService.fetchSource(id);

    return NextResponse.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch from connector";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/connectors/[id]
 * Reset connector error status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();

    if (body.action === "reset") {
      await connectorService.resetSourceStatus(id);

      return NextResponse.json({
        success: true,
        message: "Connector status reset",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update connector";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
