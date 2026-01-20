import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/exports
 * Returns export history for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const { data: exports, error } = await supabase
      .from("exports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit ? parseInt(limit, 10) : 50);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: exports,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch exports";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
