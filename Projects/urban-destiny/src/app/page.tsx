import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="py-12">
      <div className="flex flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Urban Destiny
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Your modern urban lifestyle companion
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Get started by exploring the features
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button>Get Started</Button>
            <Button variant="outline">Learn More</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
