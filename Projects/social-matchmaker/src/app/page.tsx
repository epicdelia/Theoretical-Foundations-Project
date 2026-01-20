import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Users, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12">
      <main className="flex flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-2">
          <Heart className="h-10 w-10 text-secondary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Social Matchmaker
          </h1>
        </div>

        <p className="max-w-md text-lg text-muted-foreground">
          Connect with amazing people in your community. Find friends, mentors, and collaborators.
        </p>

        <div className="flex gap-4">
          <Button size="lg">
            <Sparkles className="h-5 w-5" />
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            <Users className="h-5 w-5" />
            Browse Profiles
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <CardTitle className="text-base">Jane Doe</CardTitle>
                  <CardDescription>Product Designer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>Design</Badge>
                <Badge variant="secondary">UX</Badge>
                <Badge variant="accent">Figma</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <CardTitle className="text-base">Alex Smith</CardTitle>
                  <CardDescription>Software Engineer</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>React</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="accent">Node.js</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>MJ</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <CardTitle className="text-base">Morgan Jay</CardTitle>
                  <CardDescription>Startup Founder</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge>Startup</Badge>
                <Badge variant="secondary">AI</Badge>
                <Badge variant="accent">Growth</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
