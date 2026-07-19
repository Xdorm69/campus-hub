"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-24 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="font-serif text-lg font-semibold">Something went wrong</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page hit an unexpected error. You can try again, or head back to your dashboard.
      </p>
      <div className="mt-2 flex gap-2">
        <Button variant="outline" onClick={() => reset()}>Try again</Button>
        <Button><Link href="/">Go to dashboard</Link></Button>
      </div>
    </div>
  );
}