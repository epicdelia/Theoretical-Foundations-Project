"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "./navigation";
import { PageTransition } from "./page-transition";
import { cn } from "@/lib/utils";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

// Routes that should NOT show the navigation
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/auth/spotify-callback",
  "/onboarding/spotify",
  "/onboarding/profile",
  "/onboarding/personality",
  "/onboarding/conflict",
];

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const pathname = usePathname();

  // Check if this is a public route (no navigation needed)
  const isPublicRoute = PUBLIC_ROUTES.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(route);
  });

  // Don't show navigation on public routes
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Main content area - offset for desktop sidebar */}
      <main
        className={cn(
          "min-h-screen pb-20 md:pb-0 md:pl-64",
          "transition-all duration-200"
        )}
      >
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
