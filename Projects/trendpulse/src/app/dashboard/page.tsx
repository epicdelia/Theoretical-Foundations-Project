import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectorDashboard } from "@/components/connectors";
import { DailyDigest } from "@/components/digest";
import { VoiceProfileDashboard } from "@/components/voice";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">TrendPulse</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.email}
            </span>
            <ThemeToggle />
            <form action="/auth/signout" method="POST">
              <Button variant="outline" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <Tabs defaultValue="digest" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
            <TabsTrigger value="digest" className="text-xs sm:text-sm">
              Daily Digest
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs sm:text-sm">
              Voice Profiles
            </TabsTrigger>
            <TabsTrigger value="connectors" className="text-xs sm:text-sm">
              Data Sources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="digest" className="space-y-6">
            <DailyDigest maxTrends={5} />
          </TabsContent>

          <TabsContent value="voice" className="space-y-6">
            <VoiceProfileDashboard />
          </TabsContent>

          <TabsContent value="connectors">
            <ConnectorDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
