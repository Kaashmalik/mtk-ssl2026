"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/hooks/use-language";
import { PWARegister } from "@/components/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
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
    </ClerkProvider>
  );
}
