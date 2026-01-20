import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Heart,
  Users,
  Sparkles,
  DollarSign,
  Shield,
  CheckCircle,
  Trophy,
  ArrowRight,
  Clock,
  UserCheck,
} from "lucide-react";

const topMatchmakers = [
  { name: "Sarah M.", matches: 47, earnings: 4700, initials: "SM" },
  { name: "Mike D.", matches: 38, earnings: 3800, initials: "MD" },
  { name: "Emma R.", matches: 32, earnings: 3200, initials: "ER" },
  { name: "James K.", matches: 28, earnings: 2800, initials: "JK" },
  { name: "Lisa P.", matches: 24, earnings: 2400, initials: "LP" },
];

const earningsExamples = [
  {
    duration: "3 months together",
    payout: "$50",
    description: "First milestone bonus",
  },
  {
    duration: "6 months together",
    payout: "$100",
    description: "Relationship bonus",
  },
  {
    duration: "1 year together",
    payout: "$250",
    description: "Anniversary bonus",
  },
  {
    duration: "Engagement",
    payout: "$500",
    description: "Ultimate matchmaker reward",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="h-10 w-10 md:h-12 md:w-12 text-secondary" />
          <span className="text-2xl md:text-3xl font-bold text-primary">
            Social Matchmaker
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold max-w-4xl mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Turn Your Matchmaking Skills Into Cash
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-8">
          Know two people who would be perfect together? Introduce them and earn
          real money when your matches last.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">
              <Sparkles className="h-5 w-5" />
              Start Matchmaking
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">
              <Users className="h-5 w-5" />
              Sign In
            </Link>
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          How It Works
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                <Badge>1</Badge>
                Connect Friends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Think of two single friends who would hit it off. Add them to
                your match list and we&apos;ll help you introduce them.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                <Heart className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                <Badge variant="secondary">2</Badge>
                Make a Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Facilitate the introduction. Share why you think they&apos;d be
                great together and let the sparks fly.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <DollarSign className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                <Badge variant="accent">3</Badge>
                Earn When It Lasts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                When your match becomes a real relationship, you earn rewards at
                each milestone. The longer they last, the more you earn!
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Earnings Showcase Section */}
      <section className="py-16 md:py-20 bg-muted/30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
            Earn Real Money for Successful Matches
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Your matchmaking skills are valuable. We reward you at every
            relationship milestone.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {earningsExamples.map((example) => (
              <Card key={example.duration} className="text-center">
                <CardHeader>
                  <div className="mx-auto mb-2">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{example.duration}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl md:text-4xl font-bold text-accent mb-2">
                    {example.payout}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {example.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview Section */}
      <section className="py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">
          Top Matchmakers
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          Join our community of successful matchmakers earning real rewards.
        </p>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {topMatchmakers.map((matchmaker, index) => (
                <div
                  key={matchmaker.name}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center">
                      {index === 0 ? (
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      ) : (
                        <span className="text-lg font-bold text-muted-foreground">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <Avatar>
                      <AvatarFallback>{matchmaker.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{matchmaker.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {matchmaker.matches} successful matches
                      </p>
                    </div>
                  </div>
                  <Badge variant="accent" className="text-sm">
                    ${matchmaker.earnings.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Trust & Safety Section */}
      <section className="py-16 md:py-20 bg-muted/30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h2 className="text-2xl md:text-3xl font-bold text-center">
              Trust & Safety
            </h2>
          </div>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            We take verification seriously to ensure a safe experience for
            everyone.
          </p>

          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Identity Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      All matchmakers verify their identity before they can
                      submit matches and earn rewards.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10">
                    <CheckCircle className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Match Confirmation</h3>
                    <p className="text-sm text-muted-foreground">
                      Both parties must confirm the match before any rewards are
                      processed, ensuring authenticity.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Privacy Protected</h3>
                    <p className="text-sm text-muted-foreground">
                      Your personal information is encrypted and never shared
                      without your explicit consent.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 text-center">
        <h2 className="text-2xl md:text-4xl font-bold mb-4">
          Ready to Start Matchmaking?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Join thousands of matchmakers already earning rewards for connecting
          people.
        </p>

        <Button size="lg" asChild>
          <Link href="/signup">
            Get Started Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border mt-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-secondary" />
            <span className="font-semibold">Social Matchmaker</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Social Matchmaker. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
