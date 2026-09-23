"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";

function resolveClerkPublishableKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  if (!key) return undefined;
  if (/\[[^\]]+\]/.test(key)) return undefined;
  if (/your_|get from|placeholder|replace_with|changeme/i.test(key)) {
    return undefined;
  }
  if (!/^pk_(test|live)_/.test(key) || key.length < 40) return undefined;
  return key;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const publishableKey = resolveClerkPublishableKey();

  const themed = (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );

  if (!publishableKey) {
    return themed;
  }

  return <ClerkProvider publishableKey={publishableKey}>{themed}</ClerkProvider>;
}
