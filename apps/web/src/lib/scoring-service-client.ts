/**
 * HTTP client for Nest scoring-service (canonical ball-write SoT).
 * Server-actions authenticate the user first, then proxy mutations here.
 */

const DEFAULT_SCORING_URL = "http://localhost:4002";

function scoringBaseUrl(): string {
  return (
    process.env.SCORING_SERVICE_URL?.replace(/\/$/, "") ||
    DEFAULT_SCORING_URL
  );
}

export type ScoringProxyBallInput = {
  matchId: string;
  inningsId: string;
  over: number;
  ball: number;
  runs: number;
  batsmanId: string;
  bowlerId: string;
  extras?: { type: "wide" | "noball" | "bye" | "legbye"; runs: number };
  wicket?: { type: string; playerId: string; fielderId?: string };
};

export type ScoringProxyBallResult = {
  ballId: string;
  scorecard: {
    matchId: string;
    innings: number;
    totalRuns: number;
    totalWickets: number;
    overs: number;
    balls: number;
    runRate: number;
  };
};

async function scoringFetch<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const url = `${scoringBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(
      `Scoring service unreachable at ${url}. Start services/scoring-service or set SCORING_SERVICE_URL. (${err instanceof Error ? err.message : "network error"})`,
    );
  }

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body.message) {
        detail = Array.isArray(body.message)
          ? body.message.join(", ")
          : body.message;
      }
    } catch {
      /* ignore */
    }
    throw new Error(`Scoring service error (${res.status}): ${detail}`);
  }

  return (await res.json()) as T;
}

export async function proxyRecordBall(
  input: ScoringProxyBallInput,
): Promise<ScoringProxyBallResult> {
  return scoringFetch<ScoringProxyBallResult>("/scoring/ball", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function proxyUndoBall(
  matchId: string,
  ballId: string,
): Promise<unknown> {
  return scoringFetch("/scoring/ball/undo", {
    method: "POST",
    body: JSON.stringify({ matchId, ballId }),
  });
}
