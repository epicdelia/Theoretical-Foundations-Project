import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/jobs/trigger
 * Manually trigger a job
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { jobType } = body;

    if (!jobType || !["fetch_sources", "score_trends", "send_digest"].includes(jobType)) {
      return NextResponse.json(
        { error: "Invalid job type" },
        { status: 400 }
      );
    }

    // Map job types to their API endpoints
    const jobEndpoints: Record<string, string> = {
      fetch_sources: "/api/cron/fetch-sources",
      score_trends: "/api/cron/score-trends",
      send_digest: "/api/cron/daily-digest",
    };

    const endpoint = jobEndpoints[jobType];

    // Call the cron endpoint internally
    const baseUrl = request.headers.get("host");
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const url = `${protocol}://${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        // Pass cron secret for internal authorization
        Authorization: `Bearer ${process.env.CRON_SECRET || "manual-trigger"}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Job failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Job ${jobType} triggered successfully`,
      result: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger job" },
      { status: 500 }
    );
  }
}
