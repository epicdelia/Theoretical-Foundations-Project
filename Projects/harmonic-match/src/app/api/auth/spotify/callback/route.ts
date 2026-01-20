import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/auth/spotify";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle errors from Spotify
  if (error) {
    console.error("Spotify auth error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  // Validate required parameters
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Calculate expiry timestamp
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    // Create response that redirects to callback page with tokens
    // We use a client-side page to store tokens in localStorage
    const callbackUrl = new URL("/auth/spotify-callback", request.url);
    callbackUrl.searchParams.set("access_token", tokens.access_token);
    callbackUrl.searchParams.set("refresh_token", tokens.refresh_token);
    callbackUrl.searchParams.set("expires_at", expiresAt.toString());
    if (state) {
      callbackUrl.searchParams.set("state", state);
    }

    return NextResponse.redirect(callbackUrl);
  } catch (err) {
    console.error("Failed to exchange code for tokens:", err);
    return NextResponse.redirect(
      new URL("/login?error=token_exchange_failed", request.url)
    );
  }
}
