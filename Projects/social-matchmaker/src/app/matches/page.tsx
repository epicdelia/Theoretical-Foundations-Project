"use client";

import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function MatchesPage() {
  const { profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Matches</h1>
          <p className="text-muted-foreground">
            View and manage your matchmaking proposals
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No matches yet</CardTitle>
          <CardDescription>
            Start matchmaking to see your matches here. Connect friends and earn rewards!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Successful matches: {profile?.successful_matches ?? 0} / {profile?.matches_made ?? 0}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
