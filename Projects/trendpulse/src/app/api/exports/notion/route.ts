import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { exportToNotion } from "@/lib/exports";

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
    const { date, notionToken, databaseId } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Missing date parameter" },
        { status: 400 }
      );
    }

    if (!notionToken || !databaseId) {
      return NextResponse.json(
        { error: "Missing Notion credentials. Please provide notionToken and databaseId." },
        { status: 400 }
      );
    }

    const result = await exportToNotion(
      supabase,
      user.id,
      date,
      notionToken,
      databaseId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: result.data });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
