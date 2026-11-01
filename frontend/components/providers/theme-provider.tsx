"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes injects a blocking script, so there's no light flash before
// hydration on a dark-mode reload.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey="campushub-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
