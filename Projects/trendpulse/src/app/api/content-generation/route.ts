import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { contentGenerationService } from "@/lib/content-generation";
import type { ContentType, ContentAngle } from "@/lib/supabase/types";

const VALID_CONTENT_TYPES: ContentType[] = [
  "linkedin_post",
  "twitter_thread",
  "instagram_reel_script",
  "reply",
];

const VALID_ANGLES: ContentAngle[] = [
  "hot_take",
  "tutorial",
  "founder_story",
  "meme",
  "explainer",
];

/**
 * GET /api/content-generation
 * Returns generated content for the authenticated user
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
    const trendId = searchParams.get("trend_id") || undefined;
    const contentType = searchParams.get("content_type") as ContentType | null;
    const limit = searchParams.get("limit");

    const content = await contentGenerationService.getGeneratedContent(user.id, {
      trendId,
      contentType: contentType || undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch generated content";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/content-generation
 * Generate new content for a trend
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate required fields
    if (!body.trend_id || typeof body.trend_id !== "string") {
      return NextResponse.json(
        { success: false, error: "trend_id is required" },
        { status: 400 }
      );
    }

    if (!body.content_type || !VALID_CONTENT_TYPES.includes(body.content_type)) {
      return NextResponse.json(
        {
          success: false,
          error: `content_type must be one of: ${VALID_CONTENT_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate optional angle
    if (body.angle && !VALID_ANGLES.includes(body.angle)) {
      return NextResponse.json(
        {
          success: false,
          error: `angle must be one of: ${VALID_ANGLES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const content = await contentGenerationService.generateContent(user.id, {
      trend_id: body.trend_id,
      content_type: body.content_type,
      angle: body.angle,
      voice_profile_id: body.voice_profile_id,
    });

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate content";

    const status =
      message.includes("not found") || message.includes("required")
        ? 400
        : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
