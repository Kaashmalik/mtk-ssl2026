"use client";

import { useEffect } from "react";
import { useScoringStore } from "@/stores/scoring-store";

export function useOfflineSync() {
  const isOnline = useScoringStore((state) => state.isOnline);
  const setOnline = useScoringStore((state) => state.setOnline);
  const syncPending = useScoringStore((state) => state.syncPending);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    if (!isOnline) return;
    syncPending();
  }, [isOnline, syncPending]);
}

