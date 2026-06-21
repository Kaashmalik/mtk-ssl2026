/**
 * @deprecated This hook calls the NestJS API service's /api/matches/*
 * endpoints, which were served by the stub MatchesService (now deleted —
 * see docs/architecture/BACKEND_UNIFICATION_DECISION.md). These endpoints
 * returned hardcoded placeholder data and were never wired into a running
 * service in production.
 *
 * MIGRATION: replace usages of these hooks with the real server actions in
 * `apps/web/src/app/actions/matches.ts` (getMatches, getMatchById) and the
 * scoring flow in `apps/web/src/app/actions/scorecards.ts`. Those actions
 * talk directly to Postgres via Drizzle and return real data.
 *
 * This file is kept temporarily to avoid breaking imports in:
 *   - app/dashboard/matches/live/[id]/page.tsx
 *   - app/matches/[matchId]/scoring/page.tsx
 *   - components/scoring/player-selector.tsx
 *
 * Once those call sites are migrated to server actions, delete this file.
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const RETRY_CONFIG = { maxRetries: 3, baseDelayMs: 500 };

async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  { maxRetries, baseDelayMs }: { maxRetries: number; baseDelayMs: number } = RETRY_CONFIG
): Promise<Response> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(input, init);
      if (response.ok) return response;
      if (!response.ok && attempt < maxRetries && response.status >= 500) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError ?? new Error("Fetch failed after retries");
}

export interface Match {
  id: string;
  status: string;
  teamAId: string;
  teamBId: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface Player {
  id: string;
  name: string;
  role: string;
}

export interface MatchTeams {
  teamA: Team;
  teamB: Team;
}

export interface MatchPlayers {
  teamA: Player[];
  teamB: Player[];
}

export function useMatch(matchId: string) {
  return useQuery<Match>({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const response = await fetchWithRetry(`${API_URL}/api/matches/${matchId}`);
      if (!response.ok) throw new Error("Failed to fetch match");
      return response.json();
    },
    enabled: !!matchId,
  });
}

export function useMatchTeams(matchId: string) {
  return useQuery<MatchTeams>({
    queryKey: ["match-teams", matchId],
    queryFn: async () => {
      const response = await fetchWithRetry(`${API_URL}/api/matches/${matchId}/teams`);
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json();
    },
    enabled: !!matchId,
  });
}

export function useMatchPlayers(matchId: string) {
  return useQuery<MatchPlayers>({
    queryKey: ["match-players", matchId],
    queryFn: async () => {
      const response = await fetchWithRetry(`${API_URL}/api/matches/${matchId}/players`);
      if (!response.ok) throw new Error("Failed to fetch players");
      return response.json();
    },
    enabled: !!matchId,
  });
}

export function useStartInnings(matchId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      inningsNumber: number;
      teamId: string;
      batsmen: string[];
      bowler: string;
    }) => {
      const response = await fetchWithRetry(
        `${API_URL}/api/matches/${matchId}/innings/${data.inningsNumber}/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) throw new Error("Failed to start innings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    },
  });
}

