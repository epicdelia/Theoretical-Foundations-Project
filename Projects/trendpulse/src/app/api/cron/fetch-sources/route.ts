import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createConnector } from "@/lib/connectors";

/**
 * GET /api/cron/fetch-sources
 * Cron job to fetch data from all active connectors
 *
 * Expected cron schedule: 0 *\/2 * * * (every 2 hours)
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
        job_type: "fetch_sources",
        status: "running",
        items_processed: 0,
        metadata: { started_at: new Date().toISOString() },
      })
      .select()
      .single();

    // Get all active data sources
    const { data: sources, error: sourcesError } = await supabase
      .from("data_sources")
      .select("*")
      .eq("status", "active");

    if (sourcesError) {
      throw new Error(`Failed to fetch sources: ${sourcesError.message}`);
    }

    if (!sources || sources.length === 0) {
      // Update job log
      if (jobLog) {
        await supabase
          .from("job_logs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            items_processed: 0,
            metadata: { message: "No active sources" },
          })
          .eq("id", jobLog.id);
      }

      return NextResponse.json({
        success: true,
        message: "No active sources to fetch",
        itemsFetched: 0,
      });
    }

    let totalItemsFetched = 0;
    const results: { sourceId: string; name: string; items: number; error?: string }[] = [];

    for (const source of sources) {
      try {
        const connector = createConnector(source);

        const fetchResult = await connector.fetch();
        const items = fetchResult.items;
        totalItemsFetched += items.length;

        // Insert raw items
        if (items.length > 0) {
          const { error: insertError } = await supabase
            .from("raw_items")
            .upsert(
              items.map((item) => ({
                source_id: source.id,
                external_id: item.external_id,
                title: item.title,
                url: item.url,
                content: item.content,
                author: item.author,
                score: item.score,
                comments_count: item.comments_count,
                published_at: item.published_at,
                metadata: item.metadata,
                fetched_at: new Date().toISOString(),
              })),
              { onConflict: "source_id,external_id" }
            );

          if (insertError) {
            console.error(`Failed to insert items for ${source.name}:`, insertError);
          }
        }

        // Update source last_fetch_at
        await supabase
          .from("data_sources")
          .update({
            last_fetch_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", source.id);

        results.push({
          sourceId: source.id,
          name: source.name,
          items: items.length,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        // Update source with error
        await supabase
          .from("data_sources")
          .update({
            last_error: errorMessage,
            status: "error",
          })
          .eq("id", source.id);

        results.push({
          sourceId: source.id,
          name: source.name,
          items: 0,
          error: errorMessage,
        });
      }
    }

    // Update job log
    if (jobLog) {
      await supabase
        .from("job_logs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
          items_processed: totalItemsFetched,
          metadata: { results },
        })
        .eq("id", jobLog.id);
    }

    return NextResponse.json({
      success: true,
      message: `Fetched from ${sources.length} sources`,
      itemsFetched: totalItemsFetched,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch sources";

    // Log the failed job
    await supabase.from("job_logs").insert({
      job_type: "fetch_sources",
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
