"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/context";
import { ToastProvider } from "@/components/ui/toast";
import { MilestoneProvider } from "@/lib/milestones/context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <MilestoneProvider>{children}</MilestoneProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
