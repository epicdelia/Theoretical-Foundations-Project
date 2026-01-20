"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, isLoading } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-purple-700">
            HeartBreak Hub
          </CardTitle>
          <CardDescription>
            Your healing journey starts here. Transform heartbreak into personal
            growth.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <Button className="w-full" disabled>
              Loading...
            </Button>
          ) : user ? (
            <>
              <Button className="w-full" asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button className="w-full" asChild>
                <Link href="/signup">Start Your Journey</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
