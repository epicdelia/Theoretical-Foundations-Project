import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", data.user.id)
        .single();

      if (!existingProfile) {
        // Get display name from user metadata or email
        const displayName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.user_metadata?.display_name ||
          data.user.email?.split("@")[0] ||
          "User";

        // Create user profile
        await supabase.from("user_profiles").insert({
          user_id: data.user.id,
          display_name: displayName,
          avatar_url: data.user.user_metadata?.avatar_url || null,
        });

        // Create wallet
        await supabase.from("wallet").insert({
          user_id: data.user.id,
          balance: 0,
          pending_balance: 0,
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
