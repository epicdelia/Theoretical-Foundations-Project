import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { voiceProfileService } from "@/lib/voice";

/**
 * GET /api/voice-profiles
 * Returns all voice profiles for the authenticated user
 */
export async function GET() {
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

    const profiles = await voiceProfileService.getProfiles(user.id);

    return NextResponse.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch voice profiles";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/voice-profiles
 * Create a new voice profile
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
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!body.platform || !["linkedin", "twitter", "instagram"].includes(body.platform)) {
      return NextResponse.json(
        { success: false, error: "Valid platform is required (linkedin, twitter, instagram)" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.sample_posts)) {
      return NextResponse.json(
        { success: false, error: "sample_posts must be an array" },
        { status: 400 }
      );
    }

    const profile = await voiceProfileService.createProfile(user.id, {
      name: body.name,
      platform: body.platform,
      sample_posts: body.sample_posts,
      is_default: body.is_default ?? false,
    });

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create voice profile";

    const status = message.includes("required") || message.includes("Maximum")
      ? 400
      : 500;

    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}
