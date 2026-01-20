import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { voiceProfileService } from "@/lib/voice";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/voice-profiles/[id]
 * Get a single voice profile
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const profile = await voiceProfileService.getProfile(id, user.id);

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Voice profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch voice profile";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/voice-profiles/[id]
 * Update a voice profile
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

    // Validate platform if provided
    if (body.platform && !["linkedin", "twitter", "instagram"].includes(body.platform)) {
      return NextResponse.json(
        { success: false, error: "Invalid platform" },
        { status: 400 }
      );
    }

    // Validate sample_posts if provided
    if (body.sample_posts !== undefined && !Array.isArray(body.sample_posts)) {
      return NextResponse.json(
        { success: false, error: "sample_posts must be an array" },
        { status: 400 }
      );
    }

    const profile = await voiceProfileService.updateProfile(id, user.id, {
      name: body.name,
      platform: body.platform,
      sample_posts: body.sample_posts,
      is_default: body.is_default,
    });

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update voice profile";

    const status = message.includes("required") || message.includes("Maximum")
      ? 400
      : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

/**
 * DELETE /api/voice-profiles/[id]
 * Delete a voice profile
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    await voiceProfileService.deleteProfile(id, user.id);

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete voice profile";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/voice-profiles/[id]
 * Re-analyze a voice profile
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const profile = await voiceProfileService.reanalyzeProfile(id, user.id);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to re-analyze voice profile";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
