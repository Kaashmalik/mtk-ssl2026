"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    workbox: any;
  }
}

export function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.workbox !== undefined
    ) {
      const wb = window.workbox;
      // Add event listeners to handle PWA lifecycle
      wb.addEventListener("installed", (event: any) => {
        console.log(`Event ${event.type} is triggered.`);
      });

      wb.addEventListener("controlling", (event: any) => {
        console.log(`Event ${event.type} is triggered.`);
      });

      wb.addEventListener("activated", (event: any) => {
        console.log(`Event ${event.type} is triggered.`);
      });

      wb.register();
    }
  }, []);

  return null;
}
