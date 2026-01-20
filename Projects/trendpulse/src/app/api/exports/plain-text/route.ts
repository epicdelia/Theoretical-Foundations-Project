import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toPlainText } from "@/lib/exports";
import type { PlainTextExportOptions } from "@/lib/exports";

/**
 * POST /api/exports/plain-text
 * Convert content to plain text format for Buffer/Metricool
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
    const { content, includeSources, includeHashtags, platform } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const options: PlainTextExportOptions = {
      includeSources: includeSources ?? false,
      includeHashtags: includeHashtags ?? true,
      platform: platform || "generic",
    };

    const plainText = toPlainText(content, options);

    return NextResponse.json({
      success: true,
      data: plainText,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
