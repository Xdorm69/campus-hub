"use client";

import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "./sidebar-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
        <AppSidebar />
        <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      </div>
    </SidebarProvider>
  );
}
