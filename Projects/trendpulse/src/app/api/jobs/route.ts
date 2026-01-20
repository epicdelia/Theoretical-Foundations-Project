import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/jobs
 * Get recent job logs
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const jobType = searchParams.get("type");

  let query = supabase
    .from("job_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (jobType) {
    query = query.eq("job_type", jobType);
  }

  const { data: jobs, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: jobs || [],
  });
}
