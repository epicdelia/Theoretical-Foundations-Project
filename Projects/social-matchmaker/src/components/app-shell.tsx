"use client";

import { NotificationsProvider } from "@/lib/notifications/context";
import { Header } from "@/components/header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      <Header />
      <main>{children}</main>
    </NotificationsProvider>
  );
}
