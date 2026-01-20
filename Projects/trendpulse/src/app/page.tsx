import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          TrendPulse
        </h1>
        <p className="text-xl text-muted-foreground">
          AI-powered trend intelligence for tech creators. Find what&apos;s trending,
          generate content in your voice, and stay ahead of the curve.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
