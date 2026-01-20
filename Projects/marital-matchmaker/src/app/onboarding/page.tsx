import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has a profile
  const { data: profile } = await supabase
    .from("users_extended")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profile) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Welcome to Marital Matchmaker
          </CardTitle>
          <CardDescription>
            Let&apos;s get to know you better. Complete your profile to start finding
            meaningful connections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Onboarding flow coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
