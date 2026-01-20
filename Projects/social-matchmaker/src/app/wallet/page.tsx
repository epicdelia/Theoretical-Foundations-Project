"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { Wallet } from "@/lib/database/types";

export default function WalletPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchWallet() {
      if (!user) return;

      const { data } = await supabase
        .from("wallet")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Check if data has an id property to verify it's a valid wallet
      if (data && "id" in data) {
        setWallet(data as Wallet);
      } else {
        setWallet(null);
      }
      setIsLoading(false);
    }

    if (user) {
      fetchWallet();
    }
  }, [user, supabase]);

  if (authLoading || isLoading) {
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
          <h1 className="text-3xl font-bold">My Wallet</h1>
          <p className="text-muted-foreground">
            Manage your earnings and payouts
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
            <CardDescription>Ready to withdraw</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              ${wallet?.balance?.toFixed(2) ?? "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Balance</CardTitle>
            <CardDescription>From active bets</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-muted-foreground">
              ${wallet?.pending_balance?.toFixed(2) ?? "0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No transactions yet</p>
        </CardContent>
      </Card>
    </div>
  );
}
