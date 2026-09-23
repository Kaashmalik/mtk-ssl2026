"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/hooks/use-language";
import { PWARegister } from "@/components/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const themed = (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <LanguageProvider>
        {children}
        <PWARegister />
      </LanguageProvider>
    </ThemeProvider>
  );

  // Build/CI without keys: skip Clerk wrapper so static generation can finish.
  // Runtime must set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (loaded from monorepo root via next.config).
  if (!publishableKey) {
    return themed;
  }

  return <ClerkProvider publishableKey={publishableKey}>{themed}</ClerkProvider>;
}
