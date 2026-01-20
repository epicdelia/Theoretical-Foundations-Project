import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { TrendScoringService } from "@/lib/trends";

/**
 * GET /api/cron/score-trends
 * Cron job to score and rank trends daily
 *
 * Expected cron schedule: 0 6 * * * (daily at 6 AM UTC)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Create admin Supabase client for cron operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const startTime = Date.now();

  try {
    // Log job start
    const { data: jobLog } = await supabase
      .from("job_logs")
      .insert({
        job_type: "score_trends",
        status: "running",
        items_processed: 0,
        metadata: { started_at: new Date().toISOString() },
      })
      .select()
      .single();

    // Run the scoring service
    const scoringService = new TrendScoringService();
    const result = await scoringService.scoreTrends();

    // Update job log
    if (jobLog) {
      await supabase
        .from("job_logs")
        .update({
          status: result.success ? "completed" : "failed",
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          items_processed: result.trendsCreated,
          error_message: result.error || null,
          metadata: {
            trendsProcessed: result.trendsProcessed,
            trendsCreated: result.trendsCreated,
          },
        })
        .eq("id", jobLog.id);
    }

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
      message: `Scored ${result.trendsProcessed} trends, created ${result.trendsCreated}`,
      trendsProcessed: result.trendsProcessed,
      trendsCreated: result.trendsCreated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to score trends";

    // Log the failed job
    await supabase.from("job_logs").insert({
      job_type: "score_trends",
      status: "failed",
      completed_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      items_processed: 0,
      error_message: message,
      metadata: {},
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
