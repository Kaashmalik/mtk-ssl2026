"use client";

import { io, Socket } from "socket.io-client";
import type { BallData } from "@/stores/scoring-store";

// ─── Shared Event Constants ──────────────────────────────────
// These MUST match services/api/src/scoring/scoring.events.ts.
// If you add/rename events, update BOTH files.
export const ScoringEvents = {
  JoinMatch: "join-match",
  LeaveMatch: "leave-match",
  BallAdded: "ball-added",
  BallUndo: "ball-undo",
  MatchState: "match-state",
  MatchStateUpdated: "match-state-updated",
  ScorerJoined: "scorer-joined",
  ScorerLeft: "scorer-left",
  BallRemoved: "ball-removed",
} as const;

let socket: Socket | null = null;
const activeSubscriptions = new Set<string>();
let connectListeners = 0;

function ensureSocket(): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4002";
  const authToken = process.env.NEXT_PUBLIC_SCORING_WS_TOKEN;

  socket = io(`${wsUrl}/scoring`, {
    path: "/socket.io",
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    transports: ["websocket", "polling"],
    timeout: 20000,
    auth: authToken ? { token: authToken } : undefined,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
    // Re-join all active subscriptions on reconnect
    for (const matchId of activeSubscriptions) {
      socket?.emit("join-match", { matchId });
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (error: Error) => {
    console.error("Socket connect error:", error.message);
  });

  socket.on("error", (error: Error) => {
    console.error("Socket error:", error);
  });

  return socket;
}

function joinMatchRoom(matchId: string): () => void {
  const s = ensureSocket();
  const wasAlreadySubscribed = activeSubscriptions.has(matchId);
  activeSubscriptions.add(matchId);

  if (!wasAlreadySubscribed) {
    if (s.connected) {
      s.emit("join-match", { matchId });
    }
  }

  return () => leaveMatchRoom(matchId);
}

function leaveMatchRoom(matchId: string): void {
  activeSubscriptions.delete(matchId);
  if (socket?.connected) {
    socket.emit("leave-match", { matchId });
  }
  // Only disconnect if no subscriptions remain AND no listeners registered
  if (activeSubscriptions.size === 0 && connectListeners === 0) {
    socket?.disconnect();
    socket = null;
  }
}

export interface BallAddedEvent {
  matchId: string;
  ball: {
    ballId: string;
    inningsId: string;
    over: number;
    ball: number;
    runs: number;
    batsmanId: string;
    bowlerId: string;
    timestamp: string;
    extras?: {
      type: "wide" | "noball" | "bye" | "legbye";
      runs: number;
    };
    wicket?: {
      type: string;
      playerId: string;
    };
  };
  scorerId: string;
}

export interface BallRemovedEvent {
  matchId: string;
  ballId: string;
  scorerId: string;
}

export interface MatchStateEvent {
  matchId: string;
  innings: {
    id: string;
    teamId: string;
    totalRuns: number;
    totalWickets: number;
    overs: number;
    balls: number;
  };
  currentOver: string[];
}

export function subscribeToMatch(matchId: string, callbacks: {
  onBallAdded?: (data: BallAddedEvent) => void;
  onBallRemoved?: (data: BallRemovedEvent) => void;
  onMatchState?: (data: MatchStateEvent) => void;
  onMatchStateUpdated?: (data: MatchStateEvent) => void;
}): () => void {
  connectListeners++;
  const unsubscribe = joinMatchRoom(matchId);
  const s = ensureSocket();

  if (callbacks.onBallAdded) {
    s.on(ScoringEvents.BallAdded, callbacks.onBallAdded);
  }
  if (callbacks.onBallRemoved) {
    s.on(ScoringEvents.BallRemoved, callbacks.onBallRemoved);
  }
  if (callbacks.onMatchState) {
    s.on(ScoringEvents.MatchState, callbacks.onMatchState);
  }
  if (callbacks.onMatchStateUpdated) {
    s.on(ScoringEvents.MatchStateUpdated, callbacks.onMatchStateUpdated);
  }

  return () => {
    connectListeners = Math.max(0, connectListeners - 1);
    if (callbacks.onBallAdded) {
      s.off(ScoringEvents.BallAdded, callbacks.onBallAdded);
    }
    if (callbacks.onBallRemoved) {
      s.off(ScoringEvents.BallRemoved, callbacks.onBallRemoved);
    }
    if (callbacks.onMatchState) {
      s.off(ScoringEvents.MatchState, callbacks.onMatchState);
    }
    if (callbacks.onMatchStateUpdated) {
      s.off(ScoringEvents.MatchStateUpdated, callbacks.onMatchStateUpdated);
    }
    unsubscribe();
  };
}

/**
 * Emit a ball event to the scoring gateway.
 * @param matchId - The match UUID
 * @param inningsId - The active innings UUID (MUST be passed from scoring state)
 * @param ballData - The ball data from the scoring store
 */
export function emitBall(matchId: string, inningsId: string, ballData: BallData): void {
  if (!inningsId) {
    console.error("[socket] emitBall called without inningsId — ball will be rejected by server");
    return;
  }

  joinMatchRoom(matchId);
  const s = ensureSocket();

  const extras = ballData.isWide
    ? { type: "wide" as const, runs: ballData.runs }
    : ballData.isNoBall
      ? { type: "noball" as const, runs: ballData.runs }
      : ballData.isBye
        ? { type: "bye" as const, runs: ballData.runs }
        : ballData.isLegBye
          ? { type: "legbye" as const, runs: ballData.runs }
          : undefined;

  const wicket = ballData.isWicket
    ? {
        type: ballData.wicketType || "bowled",
        playerId: ballData.batsmanId || "",
      }
    : undefined;

  // Emit "ball-added" — matches ScoringEvents.BallAdded on the server gateway
  s.emit(ScoringEvents.BallAdded, {
    matchId,
    ballData: {
      inningsId,
      over: ballData.overNumber,
      ball: ballData.ballNumber,
      runs: ballData.runs,
      extras,
      wicket,
      batsmanId: ballData.batsmanId || "",
      bowlerId: ballData.bowlerId || "",
      timestamp: new Date(ballData.timestamp),
    },
  });
}

export function emitUndoBall(matchId: string, ballId: string): void {
  joinMatchRoom(matchId);
  const s = ensureSocket();
  // Emit "ball-undo" — matches ScoringEvents.BallUndo on the server gateway
  s.emit(ScoringEvents.BallUndo, { matchId, ballId });
}

export function onBallAdded(handler: (data: BallAddedEvent) => void): void {
  const s = ensureSocket();
  s.on(ScoringEvents.BallAdded, handler);
}

export function offBallAdded(handler: (data: BallAddedEvent) => void): void {
  const s = ensureSocket();
  s.off(ScoringEvents.BallAdded, handler);
}

export function getSocketStatus(): { connected: boolean; subscriptions: string[] } {
  return {
    connected: socket?.connected ?? false,
    subscriptions: Array.from(activeSubscriptions),
  };
}

export function getSocket(room?: string): Socket {
  const s = ensureSocket();
  if (room) {
    joinMatchRoom(room);
  }
  return s;
}

export function disconnectSocket(): void {
  activeSubscriptions.clear();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

