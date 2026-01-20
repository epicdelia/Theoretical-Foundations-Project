import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConnectorDashboard } from "@/components/connectors";

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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">TrendPulse</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <form action="/auth/signout" method="POST">
              <Button variant="outline" size="sm" type="submit">
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="connectors">Data Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Today&apos;s Trending Topics</h2>
              <p className="text-muted-foreground">
                AI-curated trends in Tech &amp; AI, ranked by relevance
              </p>
            </div>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to TrendPulse!</CardTitle>
                  <CardDescription>
                    Your daily trend intelligence dashboard is ready
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Once data sources are connected and trends are scored, you&apos;ll see
                    your top 5 daily trends here with AI-generated content ready to
                    post.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="connectors">
            <ConnectorDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
