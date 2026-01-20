"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { useAuth } from "@/lib/auth/context";
import { THERAPISTS } from "@/lib/therapists/data";
import {
  SPECIALTIES,
  LOCATIONS,
  type TherapistSpecialty,
  type TherapistLocation,
} from "@/lib/therapists/types";
import {
  Sparkles,
  LogOut,
  NotebookPen,
  Trophy,
  Library,
  ExternalLink,
  AlertTriangle,
  Phone,
  MessageCircle,
  Heart,
  MapPin,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";

export default function TherapistsPage() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [selectedSpecialty, setSelectedSpecialty] = useState<
    TherapistSpecialty | "all"
  >("all");
  const [selectedLocation, setSelectedLocation] = useState<
    TherapistLocation | "all"
  >("all");

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const filteredTherapists = useMemo(() => {
    let filtered = THERAPISTS;

    if (selectedSpecialty !== "all") {
      filtered = filtered.filter((t) => t.specialty === selectedSpecialty);
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter((t) => t.location === selectedLocation);
    }

    return filtered;
  }, [selectedSpecialty, selectedLocation]);

  const getSpecialtyLabel = (specialty: TherapistSpecialty) => {
    return SPECIALTIES.find((s) => s.value === specialty)?.label || specialty;
  };

  const getLocationLabel = (location: TherapistLocation) => {
    return LOCATIONS.find((l) => l.value === location)?.label || location;
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <span className="font-semibold text-purple-700">HeartBreak Hub</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/journal">
                    <NotebookPen className="h-4 w-4 mr-2" />
                    Journal
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/milestones">
                    <Trophy className="h-4 w-4 mr-2" />
                    Milestones
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/library">
                    <Library className="h-4 w-4 mr-2" />
                    Library
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-2">
            <Heart className="h-8 w-8" />
            Therapist Directory
          </h1>
          <p className="text-muted-foreground mt-1">
            Find professional help for your healing journey
          </p>
        </div>

        {/* Disclaimer Banner */}
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              These are external resources. We are not affiliated with these
              providers. Please verify credentials and conduct your own research
              before engaging with any therapist.
            </p>
          </CardContent>
        </Card>

        {/* Crisis Resources Section */}
        <Card className="mb-8 border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Phone className="h-5 w-5" />
              Crisis Resources
            </CardTitle>
            <CardDescription className="text-red-600">
              If you are in crisis or need immediate support, please reach out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-700">
                    988 Suicide & Crisis Lifeline
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Free, confidential support 24/7
                </p>
                <p className="text-lg font-bold text-red-700">Call or text: 988</p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-4 w-4 text-red-600" />
                  <span className="font-semibold text-red-700">
                    Crisis Text Line
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Text-based crisis support available 24/7
                </p>
                <p className="text-lg font-bold text-red-700">Text HOME to 741741</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters Section */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Select
            value={selectedSpecialty}
            onValueChange={(value) =>
              setSelectedSpecialty(value as TherapistSpecialty | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by specialty" />
            </SelectTrigger>
            <SelectContent>
              {SPECIALTIES.map((specialty) => (
                <SelectItem key={specialty.value} value={specialty.value}>
                  {specialty.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedLocation}
            onValueChange={(value) =>
              setSelectedLocation(value as TherapistLocation | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((location) => (
                <SelectItem key={location.value} value={location.value}>
                  {location.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredTherapists.length} therapist
          {filteredTherapists.length !== 1 ? "s" : ""}
        </p>

        {/* Therapist List */}
        {filteredTherapists.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Stethoscope className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No therapists found</h3>
                <p className="text-muted-foreground mt-1">
                  Try adjusting your filters to see more results.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedSpecialty("all");
                  setSelectedLocation("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTherapists.map((therapist) => (
              <Card
                key={therapist.id}
                className="hover:border-purple-300 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">{therapist.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                          <Stethoscope className="h-3 w-3" />
                          {getSpecialtyLabel(therapist.specialty)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-sm text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
                          <MapPin className="h-3 w-3" />
                          {getLocationLabel(therapist.location)}
                        </span>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <a
                        href={therapist.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit Website
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {therapist.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
