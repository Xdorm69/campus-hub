"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** The 48px top bar every screen shares (Discord's channel header). */
export function PageHeader({ icon, title, description, actions, className }: PageHeaderProps) {
  const sidebar = useSidebar();

  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center gap-2 border-b border-border px-3 shadow-sm md:px-4",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:hidden"
        onClick={sidebar.open}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <h1 className="truncate text-base font-semibold">{title}</h1>

      {description && (
        <>
          <div className="mx-1 hidden h-6 w-px shrink-0 bg-border sm:block" />
          <p className="hidden min-w-0 truncate text-sm text-muted-foreground sm:block">
            {description}
          </p>
        </>
      )}

      {actions && <div className="ml-auto flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}

/** Scrollable body for non-chat pages. */
export function PageBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className={cn("mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8", className)}>
        {children}
      </div>
    </div>
  );
}
