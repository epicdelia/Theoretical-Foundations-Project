import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ContentPreviewPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-purple-700">
            Content Preview
          </CardTitle>
          <CardDescription>
            Explore sample content from our healing pathways
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-muted-foreground">
            This is a public page accessible without authentication.
            Browse sample content to see what HeartBreak Hub offers.
          </p>
          <Button className="w-full" asChild>
            <Link href="/signup">Sign Up to Access Full Content</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
