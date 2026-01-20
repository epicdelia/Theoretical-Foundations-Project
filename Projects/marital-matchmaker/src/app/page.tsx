import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12">
      <div className="text-center space-y-6 mb-12">
        <Badge variant="secondary" className="mb-4">
          Welcome to Love
        </Badge>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary tracking-tight">
          Marital Matchmaker
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
          Find your perfect match with our elegant matchmaking platform.
          Where meaningful connections begin.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button size="lg" className="gap-2">
            <Heart className="h-5 w-5" />
            Get Started
          </Button>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Meaningful Matches</CardTitle>
            <CardDescription>
              Our algorithm considers compatibility on multiple dimensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Beyond surface-level attraction, we help you find partners who share your values, goals, and vision for the future.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Privacy First</CardTitle>
            <CardDescription>
              Your information stays secure and private
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We take your privacy seriously. Your personal data is encrypted and never shared without your explicit consent.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Expert Guidance</CardTitle>
            <CardDescription>
              Professional matchmakers assist your journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our team of experienced matchmakers provides personalized support to help you navigate your path to love.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
