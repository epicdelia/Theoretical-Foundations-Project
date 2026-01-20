import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Globe,
  Briefcase,
  Heart,
  DollarSign,
  Smile,
  ClipboardList,
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const featuredCities = [
  { name: "Tokyo", country: "Japan", image: "🗼", matchScore: 94 },
  { name: "Barcelona", country: "Spain", image: "🏛️", matchScore: 91 },
  { name: "Austin", country: "USA", image: "🎸", matchScore: 89 },
  { name: "Lisbon", country: "Portugal", image: "🌊", matchScore: 87 },
  { name: "Singapore", country: "Singapore", image: "🏙️", matchScore: 86 },
  { name: "Amsterdam", country: "Netherlands", image: "🚲", matchScore: 85 },
];

const assessmentDimensions = [
  {
    icon: Briefcase,
    title: "Career",
    description: "Job market strength, industry presence, and professional growth opportunities",
  },
  {
    icon: Heart,
    title: "Lifestyle",
    description: "Culture, entertainment, climate, and quality of life factors",
  },
  {
    icon: DollarSign,
    title: "Cost of Living",
    description: "Housing, transportation, food, and overall affordability",
  },
  {
    icon: Smile,
    title: "Happiness",
    description: "Social connections, safety, healthcare, and well-being indicators",
  },
];

const howItWorks = [
  {
    step: 1,
    icon: ClipboardList,
    title: "Take Assessment",
    description: "Answer questions about your career goals, lifestyle preferences, and priorities",
  },
  {
    step: 2,
    icon: Search,
    title: "Get Matches",
    description: "Our AI analyzes 100+ cities to find your perfect matches",
  },
  {
    step: 3,
    icon: MapPin,
    title: "Explore Cities",
    description: "Dive deep into city profiles, compare options, and plan your move",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-urban-dark via-urban-slate/80 to-urban-teal/60" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJncmlkIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjMiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat" />
          {/* World map dots pattern */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-urban-blue rounded-full animate-pulse" />
          <div className="absolute top-1/3 left-1/2 w-3 h-3 bg-urban-teal rounded-full animate-pulse delay-100" />
          <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-urban-blue rounded-full animate-pulse delay-200" />
          <div className="absolute top-2/3 left-2/3 w-2 h-2 bg-urban-teal rounded-full animate-pulse delay-300" />
          <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-urban-blue rounded-full animate-pulse delay-150" />
          <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-urban-teal rounded-full animate-pulse delay-250" />
        </div>
        <div className="relative px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
              <Globe className="h-4 w-4" />
              <span>AI-Powered City Matching</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find Your Perfect City
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/80 sm:text-xl">
              Discover where you truly belong. Our AI analyzes your career goals, lifestyle preferences,
              and happiness factors to match you with cities around the world.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto text-base px-8 py-6">
                <Link href="/assessment">
                  Start Your Assessment
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
                <Link href="#how-it-works">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Smart City Matching
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Our AI analyzes four key dimensions to find cities that align with your unique profile
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {assessmentDimensions.map((dimension) => (
            <Card key={dimension.title} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <dimension.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl">{dimension.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {dimension.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to discover your ideal city
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {howItWorks.map((item, index) => (
            <div key={item.step} className="relative">
              {index < howItWorks.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background border-2 border-primary shadow-md">
                    <item.icon className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Cities Carousel */}
      <section className="py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Popular Destinations
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore some of the most sought-after cities by our users
          </p>
        </div>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {featuredCities.map((city) => (
              <Card
                key={city.name}
                className="flex-shrink-0 w-[280px] snap-start hover:shadow-lg transition-shadow cursor-pointer"
              >
                <CardHeader className="pb-2">
                  <div className="text-6xl mb-2">{city.image}</div>
                  <CardTitle className="text-xl">{city.name}</CardTitle>
                  <CardDescription>{city.country}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Match Score</span>
                    <span className="text-lg font-semibold text-primary">{city.matchScore}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${city.matchScore}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="hidden sm:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between pointer-events-none px-2">
            <Button
              variant="outline"
              size="icon"
              className="pointer-events-auto rounded-full bg-background/80 backdrop-blur-sm shadow-md"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="pointer-events-auto rounded-full bg-background/80 backdrop-blur-sm shadow-md"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="relative overflow-hidden rounded-2xl mx-4 sm:mx-6 lg:mx-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary" />
          <div className="relative px-6 py-16 sm:px-12 sm:py-20 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Find Your Perfect City?
            </h2>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
              Take our 5-minute assessment and discover cities that match your career, lifestyle, and happiness goals.
            </p>
            <div className="mt-8">
              <Button asChild size="lg" variant="secondary" className="text-base px-8 py-6 bg-white text-primary hover:bg-white/90">
                <Link href="/assessment">
                  Start Your Assessment
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
