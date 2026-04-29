"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/hooks/use-language";
import { CommandPalette } from "@mtk/ui";
import { PWARegister } from "@/components/pwa-register";
import { useRouter } from "next/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

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
          <CommandPalette router={router} />
          <PWARegister />
        </LanguageProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
