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
import {
  Heart,
  Users,
  TrendingUp,
  ClipboardList,
  Target,
  BarChart3,
  Quote,
} from "lucide-react";

export default function Home() {
  const { user, isLoading } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between py-6">
        <Link href="/" className="text-2xl font-bold text-purple-700">
          HeartBreak Hub
        </Link>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <Button disabled size="sm">
              Loading...
            </Button>
          ) : user ? (
            <>
              <Button asChild size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/quiz">Start Free</Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-16 md:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <Heart className="h-16 w-16 mx-auto text-purple-500 fill-purple-200" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-purple-900 mb-6 leading-tight">
            Your healing journey starts here
          </h1>
          <p className="text-lg md:text-xl text-warm-600 mb-8 max-w-2xl mx-auto">
            Transform heartbreak into personal growth with science-backed
            pathways, supportive community cohorts, and meaningful progress
            tracking. You don&apos;t have to heal alone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base px-8">
              <Link href="/quiz">Take the Healing Quiz</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-base px-8">
              <Link href="#how-it-works">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24 bg-warm-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-4">
              How It Works
            </h2>
            <p className="text-warm-600 text-lg max-w-2xl mx-auto">
              Three simple steps to begin your transformation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card className="text-center border-none shadow-lg bg-card">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                  <ClipboardList className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-sm font-medium text-teal-600 mb-2">
                  Step 1
                </div>
                <CardTitle className="text-xl text-purple-900">
                  Take the Quiz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Answer a few questions about your experience. We&apos;ll
                  understand where you are in your healing journey and what you
                  need most.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="text-center border-none shadow-lg bg-card">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center">
                  <Users className="h-8 w-8 text-teal-600" />
                </div>
                <div className="text-sm font-medium text-teal-600 mb-2">
                  Step 2
                </div>
                <CardTitle className="text-xl text-purple-900">
                  Join a Cohort
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Get matched with others on a similar path. Heal together in a
                  supportive group with shared experiences and goals.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="text-center border-none shadow-lg bg-card">
              <CardHeader>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warm-200 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-warm-700" />
                </div>
                <div className="text-sm font-medium text-teal-600 mb-2">
                  Step 3
                </div>
                <CardTitle className="text-xl text-purple-900">
                  Track Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  See your growth over time with meaningful metrics. Celebrate
                  milestones and understand your healing patterns.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-4">
              Everything You Need to Heal
            </h2>
            <p className="text-warm-600 text-lg max-w-2xl mx-auto">
              Scientifically-backed tools designed for emotional recovery
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Pathways */}
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-14 h-14 mb-4 rounded-xl bg-purple-100 flex items-center justify-center">
                <Target className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-purple-900 mb-3">
                Guided Pathways
              </h3>
              <p className="text-warm-600">
                Choose from multiple healing pathways tailored to different
                relationship types and experiences. Each pathway is designed by
                mental health professionals.
              </p>
            </div>

            {/* Feature 2: Community */}
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-14 h-14 mb-4 rounded-xl bg-teal-100 flex items-center justify-center">
                <Users className="h-7 w-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-purple-900 mb-3">
                Supportive Community
              </h3>
              <p className="text-warm-600">
                Connect with others who understand. Join cohorts of 8-12 people
                at similar stages, with moderated discussions and shared
                accountability.
              </p>
            </div>

            {/* Feature 3: Tracking */}
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-14 h-14 mb-4 rounded-xl bg-warm-200 flex items-center justify-center">
                <BarChart3 className="h-7 w-7 text-warm-700" />
              </div>
              <h3 className="text-xl font-semibold text-purple-900 mb-3">
                Progress Tracking
              </h3>
              <p className="text-warm-600">
                Visualize your emotional journey with mood tracking, milestone
                celebrations, and insights that help you understand your healing
                patterns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-purple-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-4">
              Stories of Healing
            </h2>
            <p className="text-warm-600 text-lg max-w-2xl mx-auto">
              Hear from others who&apos;ve walked this path
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-purple-300 mb-4" />
                <p className="text-warm-700 mb-6 italic">
                  &quot;I was skeptical at first, but the cohort experience
                  changed everything. Having others who truly understood made me
                  feel less alone. Three months later, I finally feel like
                  myself again.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center">
                    <span className="text-purple-700 font-semibold">S</span>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">Sarah M.</p>
                    <p className="text-sm text-warm-500">
                      Completed Pathway in 12 weeks
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-teal-300 mb-4" />
                <p className="text-warm-700 mb-6 italic">
                  &quot;The progress tracking helped me see that I was actually
                  getting better, even on days when it didn&apos;t feel like it.
                  Being able to look back and see how far I&apos;ve come is
                  incredibly powerful.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-200 flex items-center justify-center">
                    <span className="text-teal-700 font-semibold">J</span>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">James R.</p>
                    <p className="text-sm text-warm-500">
                      Active member for 6 months
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-warm-400 mb-4" />
                <p className="text-warm-700 mb-6 italic">
                  &quot;After my divorce, I thought I&apos;d never recover. The
                  guided pathways gave me structure when everything felt chaotic.
                  I&apos;m now helping others in my cohort the way others helped
                  me.&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warm-200 flex items-center justify-center">
                    <span className="text-warm-700 font-semibold">M</span>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">Maria L.</p>
                    <p className="text-sm text-warm-500">
                      Cohort mentor & graduate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <Heart className="h-12 w-12 mx-auto text-purple-500 fill-purple-200 mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-purple-900 mb-4">
            Ready to Begin Your Healing Journey?
          </h2>
          <p className="text-warm-600 text-lg mb-8 max-w-xl mx-auto">
            Take the first step today. Our quiz takes just 5 minutes and
            will help us understand how to best support you.
          </p>
          <Button size="lg" asChild className="text-base px-8">
            <Link href="/quiz">Start Your Healing Journey</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-200 py-12 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-purple-500 fill-purple-200" />
              <span className="font-semibold text-purple-900">
                HeartBreak Hub
              </span>
            </div>
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              <Link
                href="/about"
                className="text-warm-600 hover:text-purple-700 transition-colors"
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="text-warm-600 hover:text-purple-700 transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-warm-600 hover:text-purple-700 transition-colors"
              >
                Terms
              </Link>
            </nav>
            <p className="text-sm text-warm-500">
              &copy; {new Date().getFullYear()} HeartBreak Hub. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
