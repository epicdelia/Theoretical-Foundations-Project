"use client";

import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  const { user, profile, signOut, isLoading } = useAuth();

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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.display_name || user?.email}
          </p>
        </div>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Matchmaker Score</CardTitle>
            <CardDescription>Your reputation as a matchmaker</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{profile?.matchmaker_score ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Matches Made</CardTitle>
            <CardDescription>Total matches you&apos;ve created</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{profile?.matches_made ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
            <CardDescription>Your earnings from matchmaking</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">${profile?.total_earnings?.toFixed(2) ?? "0.00"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href="/matches">
          <Button>View Matches</Button>
        </Link>
        <Link href="/wallet">
          <Button variant="outline">My Wallet</Button>
        </Link>
      </div>
    </div>
  );
}
