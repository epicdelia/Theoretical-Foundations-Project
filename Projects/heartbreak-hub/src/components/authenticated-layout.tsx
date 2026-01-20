"use client";

import { Navigation } from "./navigation";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      {/* Main content area with offset for desktop sidebar */}
      <div className="md:pl-64">
        {children}
      </div>
    </div>
  );
}
