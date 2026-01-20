import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Brain,
  Target,
  Users,
  Shield,
  CheckCircle,
  ArrowRight,
  Sparkles,
  MessageCircle,
  Compass,
  Gem,
  Quote,
} from "lucide-react";

const compatibilityDimensions = [
  {
    icon: Heart,
    title: "Emotional Connection",
    description: "Deep understanding of emotional needs, communication styles, and how you express love.",
  },
  {
    icon: Target,
    title: "Life Goals Alignment",
    description: "Shared visions for career, family, lifestyle, and long-term aspirations.",
  },
  {
    icon: Compass,
    title: "Values & Beliefs",
    description: "Core principles, cultural values, and spiritual or philosophical alignment.",
  },
  {
    icon: Brain,
    title: "Intellectual Compatibility",
    description: "Curiosity levels, learning styles, and how you engage with ideas together.",
  },
  {
    icon: Gem,
    title: "Lifestyle Harmony",
    description: "Daily habits, social preferences, and approaches to work-life balance.",
  },
];

const howItWorks = [
  {
    step: 1,
    title: "Complete Our Quiz",
    description: "Answer thoughtful questions about your values, goals, and what you seek in a life partner.",
    icon: CheckCircle,
  },
  {
    step: 2,
    title: "Get Matched",
    description: "Our AI analyzes your responses across 5 dimensions to find deeply compatible partners.",
    icon: Sparkles,
  },
  {
    step: 3,
    title: "Connect Meaningfully",
    description: "Start conversations with context about why you're compatible, not just surface-level details.",
    icon: MessageCircle,
  },
];

const testimonials = [
  {
    name: "Sarah & Michael",
    location: "Boston, MA",
    quote: "We matched on values we didn't even know how to articulate. After 6 months of dating, we knew this was it.",
    together: "Engaged after 14 months",
  },
  {
    name: "Priya & James",
    location: "Seattle, WA",
    quote: "Other apps focused on hobbies. This one understood that we both wanted the same things from life.",
    together: "Married 2 years",
  },
  {
    name: "Elena & David",
    location: "Chicago, IL",
    quote: "The compatibility quiz was the first time I felt a dating platform actually understood what matters.",
    together: "Together 18 months",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 lg:py-32 text-center">
        <Badge variant="secondary" className="mb-6">
          For Those Seeking a Life Partner
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl">
          Find Your <span className="text-primary">Life Partner</span>,
          <br className="hidden sm:block" /> Not Just Another Date
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl">
          Move beyond swiping. Our AI-powered compatibility matching goes deeper than
          surface-level attraction to connect you with someone who shares your values,
          goals, and vision for the future.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Button size="lg" className="gap-2" asChild>
            <Link href="/signup">
              <Heart className="h-5 w-5" />
              Start Your Journey
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#how-it-works">
              Learn How It Works
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 lg:py-24 bg-muted/30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              AI-Powered Compatibility Beyond Surface Matching
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Traditional dating apps match on photos and basic preferences. We use advanced
              AI to analyze deep compatibility across the dimensions that actually predict
              long-term relationship success.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-background">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Deep Understanding</CardTitle>
                <CardDescription>
                  Our quiz reveals what you truly need in a partner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Go beyond &ldquo;I like hiking&rdquo; to understand how you approach conflict,
                  express love, and envision your future together.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Intelligent Matching</CardTitle>
                <CardDescription>
                  AI that learns what makes relationships last
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our algorithm is trained on relationship science, not engagement
                  metrics. Quality matches over endless swiping.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-background">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Meaningful Connections</CardTitle>
                <CardDescription>
                  Start conversations that matter from day one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Know why you&apos;re compatible before you even meet. Our insights
                  help you build genuine connection faster.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to finding someone who truly gets you.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {howItWorks.map((item) => (
            <div key={item.step} className="text-center">
              <div className="relative inline-flex mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button size="lg" asChild>
            <Link href="/signup">
              Take the Compatibility Quiz
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* 5 Compatibility Dimensions */}
      <section className="py-16 lg:py-24 bg-muted/30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              5 Dimensions of Deep Compatibility
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Research shows these five areas are the strongest predictors of long-term
              relationship success. We measure all of them.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {compatibilityDimensions.map((dimension) => (
              <Card key={dimension.title} className="bg-background text-center">
                <CardHeader className="pb-2">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <dimension.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{dimension.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{dimension.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              A Platform for Serious Intentions
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We&apos;re not for everyone—and that&apos;s by design. Our community is built
              for people ready to find their life partner.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Intent Verification</h3>
                <p className="text-muted-foreground">
                  Every member completes our in-depth compatibility quiz. This naturally
                  filters for people who are serious about finding a life partner, not
                  just casual dating.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Serious Users Only</h3>
                <p className="text-muted-foreground">
                  Our community values quality over quantity. Members are here because
                  they&apos;re ready to invest in finding a meaningful, lasting relationship.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Profile Authenticity</h3>
                <p className="text-muted-foreground">
                  We encourage authenticity over performance. Profiles focus on values
                  and goals, not just curated photos.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Marriage-Minded Community</h3>
                <p className="text-muted-foreground">
                  Join a community where &ldquo;looking for something serious&rdquo; is the norm,
                  not the exception. Everyone here shares your goal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 lg:py-24 bg-muted/30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real couples who found their life partners through deep compatibility matching.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="bg-background">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Quote className="h-8 w-8 text-primary/30" />
                  </div>
                  <CardDescription className="text-base italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  <Badge variant="secondary" className="mt-3">
                    {testimonial.together}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-32 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
          Ready to Find Your Person?
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Take our compatibility quiz and start connecting with people who share
          your values and vision for the future.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="gap-2" asChild>
            <Link href="/signup">
              <Heart className="h-5 w-5" />
              Create Your Profile
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">
              Already a Member? Sign In
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
