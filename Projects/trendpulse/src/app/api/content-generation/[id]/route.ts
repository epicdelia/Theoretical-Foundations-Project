import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { contentGenerationService } from "@/lib/content-generation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/content-generation/[id]
 * Returns a specific generated content
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    const content = await contentGenerationService.getContentById(user.id, id);

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch content";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/content-generation/[id]
 * Update content (toggle favorite, mark copied)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    // Handle toggle favorite
    if (body.action === "toggle_favorite") {
      const content = await contentGenerationService.toggleFavorite(user.id, id);
      return NextResponse.json({
        success: true,
        data: content,
      });
    }

    // Handle mark copied
    if (body.action === "mark_copied") {
      await contentGenerationService.markCopied(user.id, id);
      return NextResponse.json({
        success: true,
        data: { message: "Marked as copied" },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update content";

    const status = message.includes("not found") ? 404 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}

/**
 * DELETE /api/content-generation/[id]
 * Delete generated content
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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

    await contentGenerationService.deleteContent(user.id, id);

    return NextResponse.json({
      success: true,
      data: { message: "Content deleted" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete content";

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
