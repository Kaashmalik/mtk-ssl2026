import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers";
import "./globals.css";
import { Toaster } from "@mtk/ui";

export const metadata: Metadata = {
  title: "Shakir Super League - Pakistan's #1 Cricket Platform",
  description: "Modern cricket tournament management platform for leagues across Pakistan and the global diaspora.",
  keywords: ["cricket", "tournament", "league", "Pakistan", "scoring"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

