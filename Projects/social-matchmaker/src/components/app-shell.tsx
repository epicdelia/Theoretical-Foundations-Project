"use client";

import { NotificationsProvider } from "@/lib/notifications/context";
import { MobileHeader } from "@/components/mobile-header";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      {/* Mobile Header - only visible on mobile */}
      <MobileHeader />

      {/* Desktop Sidebar - only visible on md+ */}
      <DesktopSidebar />

      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">{children}</main>

      {/* Mobile Bottom Nav - only visible on mobile */}
      <MobileBottomNav />
    </NotificationsProvider>
  );
}
