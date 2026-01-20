import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmailDigest } from "@/lib/exports";

/**
 * GET /api/cron/daily-digest
 * Cron job to send daily email digests at 7 AM user timezone
 *
 * This endpoint should be called by a cron scheduler (e.g., Vercel Cron)
 * every hour. It will find users whose local time is 7 AM and send them
 * their daily digest.
 *
 * Expected cron schedule: 0 * * * * (every hour)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json(
      { error: "Email service not configured" },
      { status: 500 }
    );
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

  try {
    // Get current UTC hour
    const now = new Date();
    const utcHour = now.getUTCHours();

    // Default digest hour (7 AM) used when user hasn't set a preference
    const DEFAULT_DIGEST_HOUR = 7;

    // Fetch users with email digest enabled
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, timezone, email_digest_time")
      .eq("email_digest_enabled", true);

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users with email digest enabled",
        sent: 0,
      });
    }

    // Get today's date for trend query
    const trendDate = now.toISOString().split("T")[0];

    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const profile of profiles) {
      try {
        // Parse user's preferred digest time (default 07:00)
        const digestTime = profile.email_digest_time || `${DEFAULT_DIGEST_HOUR.toString().padStart(2, "0")}:00:00`;
        const [digestHour] = digestTime.split(":").map(Number);

        // Calculate user's local hour based on timezone
        const userLocalHour = getLocalHour(utcHour, profile.timezone);

        // Check if it's the user's digest time
        if (userLocalHour !== digestHour) {
          continue;
        }

        // Send digest
        const result = await sendEmailDigest(
          supabase,
          profile.id,
          trendDate,
          profile.email,
          resendApiKey
        );

        results.push({
          userId: profile.id,
          success: result.success,
          error: result.error,
        });

        // Log the job
        await supabase.from("job_logs").insert({
          job_type: "send_digest",
          status: result.success ? "completed" : "failed",
          items_processed: result.success ? 1 : 0,
          error_message: result.error || null,
          metadata: {
            user_id: profile.id,
            trend_date: trendDate,
          },
        });
      } catch (error) {
        results.push({
          userId: profile.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} users`,
      sent,
      failed,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process digest cron";

    // Log the failed job
    await supabase.from("job_logs").insert({
      job_type: "send_digest",
      status: "failed",
      items_processed: 0,
      error_message: message,
      metadata: {},
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Calculate local hour from UTC hour and timezone string
 */
function getLocalHour(utcHour: number, timezone: string): number {
  try {
    // Use Intl to get the current hour in the user's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    // If timezone is invalid, default to UTC
    return utcHour;
  }
}
