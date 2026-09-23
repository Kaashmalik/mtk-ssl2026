"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { useScoringStore, BallInput, type InningsState } from "@/stores/scoring-store";
import { BallInputComponent } from "@/components/scoring/ball-input";
import { LiveScorecard } from "@/components/scoring/live-scorecard";
import { ManhattanChart } from "@/components/scoring/manhattan-chart";
import { WagonWheel } from "@/components/scoring/wagon-wheel";
import { WormChart } from "@/components/scoring/worm-chart";
import { DLSCalculator } from "@/components/scoring/dls-calculator";
import { PlayerSelector } from "@/components/scoring/player-selector";
import { VoiceInput } from "@/components/scoring/voice-input";
import { Button } from "@mtk/ui";
import { Card } from "@mtk/ui";
import { Undo2, Redo2, Wifi, WifiOff, Zap, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  recordBall as recordBallAction,
  undoBall as undoBallAction,
  getMatchForScoring,
  createInnings,
  getMatchPlayersForScoring,
  type RecordBallInput,
} from "@/app/actions/scoring";
import { useScoringSocket } from "@/hooks/use-scoring-socket";

// ─── Types ────────────────────────────────────────────────────

interface MatchData {
  match: {
    id: string;
    status: string;
    matchFormat: string | null;
    totalOvers: number | null;
    teamAId: string;
    teamBId: string;
    tossWinnerId: string | null;
    tossDecision: string | null;
  };
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
  innings: Array<{
    id: string;
    matchId: string;
    teamId: string;
    inningsNumber: number;
    totalRuns: number;
    totalWickets: number;
    totalBalls: number;
    extras: number;
    byes: number;
    legByes: number;
    wides: number;
    noBalls: number;
    status: string;
  }>;
  recentBalls: Array<{
    id: string;
    inningsId: string;
    overNumber: number;
    ballNumber: number;
    runs: number;
    isWicket: boolean;
    isWide: boolean;
    isNoBall: boolean;
    isBye: boolean;
    isLegBye: boolean;
    isFour: boolean;
    isSix: boolean;
    batsmanId: string | null;
    bowlerId: string | null;
  }>;
}

interface PlayersData {
  teamA: Array<{ id: string; name: string; role: string | null }>;
  teamB: Array<{ id: string; name: string; role: string | null }>;
}

// ─── Scoring Interface ───────────────────────────────────────

function ScoringInterface() {
  const params = useParams();
  const matchId = params.matchId as string;

  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [playersData, setPlayersData] = useState<PlayersData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"scorecard" | "charts">("scorecard");

  const {
    setMatchId,
    currentInnings: currentInningsNum,
    innings1,
    innings2,
    superOver,
    isOnline,
    undo,
    redo,
    addBall,
    resetInnings,
  } = useScoringStore();

  // Get the actual innings data object
  const currentInningsData =
    currentInningsNum === 1 ? innings1 :
    currentInningsNum === 2 ? innings2 :
    superOver;

  const [selectedBatsman, setSelectedBatsman] = useState<string>();
  const [selectedBatsman2] = useState<string>();
  const [selectedBowler, setSelectedBowler] = useState<string>();

  const totalOvers = matchData?.match.totalOvers ?? 20;

  // Live updates from scoring-service WebSocket (reconnect + backoff)
  useScoringSocket(matchId);

  const currentTeamId =
    currentInningsNum === 1 ? matchData?.match.teamAId :
    currentInningsNum === 2 ? matchData?.match.teamBId :
    null;

  const [dbWriteFailed, setDbWriteFailed] = useState(false);

  // ─── Load match data from DB ───────────────────────────────
  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;

    async function loadMatchData() {
      try {
        setLoading(true);
        setLoadError(null);

        const [matchResult, playersResult] = await Promise.all([
          getMatchForScoring(matchId),
          getMatchPlayersForScoring(matchId),
        ]);

        if (cancelled) return;

        setMatchData(matchResult as MatchData);
        setPlayersData(playersResult as PlayersData);
        setMatchId(matchId);

        // Hydrate the Zustand store from DB data
        const state = useScoringStore.getState();
        const isNewMatch = state.matchId !== matchId;
        const mr = matchResult as MatchData;

        if (isNewMatch || !state.innings1) {
          const inn1 = mr.innings.find((i) => i.inningsNumber === 1);
          const inn2 = mr.innings.find((i) => i.inningsNumber === 2);

          // Build innings state from DB data
          const buildInningsState = (
            inn: MatchData["innings"][number] | undefined,
            num: number
          ): InningsState | null => {
            if (!inn) {
              if (num === 1) {
                // Create default innings 1
                return {
                  inningsId: `pending-innings-1-${matchId}`,
                  teamId: mr.match.teamAId,
                  totalRuns: 0,
                  totalWickets: 0,
                  totalBalls: 0,
                  extras: 0,
                  byes: 0,
                  legByes: 0,
                  wides: 0,
                  noBalls: 0,
                  status: "not_started",
                  currentOver: 0,
                  currentBall: 0,
                  balls: [],
                };
              }
              return null;
            }

            // Map DB balls to store format
            const inningsBalls = mr.recentBalls
              .filter((b) => b.inningsId === inn.id)
              .map((b) => ({
                id: b.id,
                overNumber: b.overNumber,
                ballNumber: b.ballNumber,
                input: (b.isWicket ? "W" : b.isWide ? "WD" : b.isNoBall ? "NB" :
                  b.isBye ? "B" : b.isLegBye ? "LB" : b.runs) as BallInput,
                runs: b.runs,
                isWicket: b.isWicket,
                isWide: b.isWide,
                isNoBall: b.isNoBall,
                isBye: b.isBye,
                isLegBye: b.isLegBye,
                isFour: b.isFour,
                isSix: b.isSix,
                batsmanId: b.batsmanId ?? undefined,
                bowlerId: b.bowlerId ?? undefined,
                timestamp: Date.now(),
              }));

            const totalBalls = inn.totalBalls;
            return {
              inningsId: inn.id,
              teamId: inn.teamId,
              totalRuns: inn.totalRuns,
              totalWickets: inn.totalWickets,
              totalBalls: inn.totalBalls,
              extras: inn.extras,
              byes: inn.byes,
              legByes: inn.legByes,
              wides: inn.wides,
              noBalls: inn.noBalls,
              status: inn.status as InningsState["status"],
              currentOver: Math.floor(totalBalls / 6),
              currentBall: totalBalls % 6,
              balls: inningsBalls,
            };
          };

          useScoringStore.setState({
            matchId,
            innings1: buildInningsState(inn1, 1),
            innings1History: { history: [], historyIndex: -1 },
            innings2: buildInningsState(inn2, 2),
            innings2History: { history: [], historyIndex: -1 },
            superOver: null,
            superOverHistory: { history: [], historyIndex: -1 },
            currentInnings: 1,
          });
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load match data:", err);
          setLoadError(err instanceof Error ? err.message : "Failed to load match");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMatchData();
    return () => { cancelled = true; };
  }, [matchId, setMatchId]);

  // ─── Persist ball to DB (with retry) ────────────────────────
  const persistBallToDB = useCallback(async () => {
    if (!matchData) return;

    const state = useScoringStore.getState();
    const inningsKey = state.currentInnings === 1 ? "innings1" :
      state.currentInnings === 2 ? "innings2" : "superOver";
    const currentInnings = state[inningsKey] as InningsState | null;
    if (!currentInnings || currentInnings.balls.length === 0) return;

    const lastBall = currentInnings.balls[currentInnings.balls.length - 1];
    if (!lastBall) return;

    // Resolve the real innings ID (may need to create in DB first)
    let inningsId = currentInnings.inningsId;

    if (inningsId.startsWith("pending-innings-")) {
      // Create the innings in DB first
      const inningsNumber = state.currentInnings === 1 ? 1 :
        state.currentInnings === 2 ? 2 : 3;
      try {
        const result = await createInnings({
          matchId: state.matchId,
          teamId: currentInnings.teamId,
          inningsNumber,
        });
        if (result.innings) {
          inningsId = result.innings.id;
          // Update store with real ID
          useScoringStore.setState({
            [inningsKey]: { ...currentInnings, inningsId },
          } as Partial<typeof state>);
        }
      } catch (err) {
        console.error("Failed to create innings:", err);
        toast.error("Failed to create innings in database. Please try again.");
        return;
      }
    }

    const ballInput: RecordBallInput = {
      matchId: state.matchId,
      inningsId,
      overNumber: lastBall.overNumber,
      ballNumber: lastBall.ballNumber,
      runs: lastBall.runs,
      batsmanId: lastBall.batsmanId || null,
      bowlerId: lastBall.bowlerId || null,
      isWicket: lastBall.isWicket,
      wicketType: lastBall.wicketType || null,
      isWide: lastBall.isWide,
      isNoBall: lastBall.isNoBall,
      isBye: lastBall.isBye,
      isLegBye: lastBall.isLegBye,
      isFour: lastBall.isFour ?? false,
      isSix: lastBall.isSix ?? false,
    };

    // Retry with exponential backoff (3 attempts)
    const MAX_RETRIES = 3;
    let attempt = 0;
    let lastError: unknown = null;

    while (attempt < MAX_RETRIES) {
      try {
        await recordBallAction(ballInput);
        setDbWriteFailed(false);
        return; // Success
      } catch (err) {
        lastError = err;
        attempt++;
        if (attempt < MAX_RETRIES) {
          // Exponential backoff: 500ms, 1500ms
          await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
        }
      }
    }

    // All retries failed
    console.error("Failed to persist ball to DB after retries:", lastError);
    setDbWriteFailed(true);
    toast.error("Failed to save ball to the database after several attempts. Your scoring is kept on this device only and is NOT synced — please re-enter the ball once the connection is stable.", {
      duration: 6000,
    });
  }, [matchData]);

  // ─── Handle Undo with DB persistence ───────────────────────
  const handleUndo = useCallback(async () => {
    const state = useScoringStore.getState();
    const currentInningsState = state.currentInnings === 1 ? state.innings1 :
      state.currentInnings === 2 ? state.innings2 :
      state.superOver;

    if (currentInningsState && currentInningsState.balls.length > 0) {
      const lastBall = currentInningsState.balls[currentInningsState.balls.length - 1];
      undo();

      // Undo in DB
      if (lastBall && !lastBall.id.startsWith("ball-")) {
        startTransition(async () => {
          try {
            await undoBallAction(state.matchId, lastBall.id);
          } catch (err) {
            console.error("Failed to undo ball in DB:", err);
            toast.error("Failed to undo ball in database. The local undo is preserved.");
          }
        });
      }
    }
  }, [undo]);

  // ─── Voice Command ─────────────────────────────────────────
  const handleVoiceCommand = useCallback(async (input: BallInput) => {
    if (!currentInningsData) return;
    const overNumber = currentInningsData.currentBall === 6 ? currentInningsData.currentOver + 1 : currentInningsData.currentOver;
    const ballNumber = currentInningsData.currentBall === 6 ? 1 : currentInningsData.currentBall + 1;
    addBall({
      overNumber,
      ballNumber,
      input,
      runs: typeof input === "number" ? input : input === "WD" || input === "NB" ? 1 : 0,
      isWicket: input === "W",
      isWide: input === "WD",
      isNoBall: input === "NB",
      isBye: input === "B",
      isLegBye: input === "LB",
      batsmanId: selectedBatsman,
      bowlerId: selectedBowler,
    });
    // Persist to DB directly (with retry)
    await persistBallToDB();
  }, [currentInningsData, addBall, selectedBatsman, selectedBowler, persistBallToDB]);

  const targetRuns = innings1 && currentInningsNum === 2 ? innings1.totalRuns + 1 : undefined;

  // ─── Loading State ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Failed to Load Match</h2>
          <p className="text-muted-foreground text-sm">{loadError}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Live Scoring</h1>
          <div className="flex items-center gap-3 mt-2">
            {matchData && (
              <span className="text-sm font-medium text-muted-foreground">
                {matchData.teamA.name} vs {matchData.teamB.name}
                {matchData.match.totalOvers && ` · ${matchData.match.totalOvers} overs`}
              </span>
            )}
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Wifi className="h-4 w-4" />
                Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-orange-600 text-sm">
                <WifiOff className="h-4 w-4" />
                Offline
              </span>
            )}
            {dbWriteFailed && (
              <span className="flex items-center gap-1 text-red-600 text-sm" role="alert">
                <AlertCircle className="h-3 w-3" />
                Unsaved changes
              </span>
            )}
            {isPending && (
              <span className="flex items-center gap-1 text-blue-600 text-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleUndo}
            variant="outline"
            size="sm"
            className="touch-manipulation"
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Undo
          </Button>
          <Button
            onClick={redo}
            variant="outline"
            size="sm"
            className="touch-manipulation"
          >
            <Redo2 className="h-4 w-4 mr-1" />
            Redo
          </Button>
          {currentInningsNum === 2 && targetRuns && (
            <DLSCalculator
              targetRuns={targetRuns}
              oversCompleted={currentInningsData ? currentInningsData.currentOver + currentInningsData.currentBall / 6 : 0}
              totalOvers={totalOvers}
              wicketsLost={currentInningsData?.totalWickets || 0}
              runsScored={currentInningsData?.totalRuns || 0}
              onApply={(revisedTarget) => {
                console.log("DLS target applied:", revisedTarget);
              }}
            />
          )}
          {currentInningsNum === "super_over" && (
            <Button
              onClick={() => resetInnings("super_over")}
              variant="outline"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-1" />
              Super Over
            </Button>
          )}
        </div>
      </div>

      {/* Innings Selector */}
      <div className="flex gap-2">
        <Button
          onClick={() => useScoringStore.setState({ currentInnings: 1 })}
          variant={currentInningsNum === 1 ? "default" : "outline"}
          size="sm"
        >
          Innings 1{matchData && ` (${matchData.teamA.name})`}
        </Button>
        <Button
          onClick={() => useScoringStore.setState({ currentInnings: 2 })}
          variant={currentInningsNum === 2 ? "default" : "outline"}
          size="sm"
        >
          Innings 2{matchData && ` (${matchData.teamB.name})`}
        </Button>
        <Button
          onClick={() => useScoringStore.setState({ currentInnings: "super_over" })}
          variant={currentInningsNum === "super_over" ? "default" : "outline"}
          size="sm"
        >
          Super Over
        </Button>
      </div>

      {/* Live Scorecard */}
      <LiveScorecard targetRuns={targetRuns} totalOvers={totalOvers} />

      {/* Tabs */}
      <div className="flex gap-2 border-b" role="tablist" aria-label="Scoring views">
        <button
          role="tab"
          aria-selected={activeTab === "scorecard"}
          onClick={() => setActiveTab("scorecard")}
          className={`px-4 py-2 font-medium ${
            activeTab === "scorecard"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          Scorecard
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "charts"}
          onClick={() => setActiveTab("charts")}
          className={`px-4 py-2 font-medium ${
            activeTab === "charts"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground"
          }`}
        >
          Charts
        </button>
      </div>

      {/* Content */}
      {activeTab === "scorecard" ? (
        <div className="space-y-4">
          {/* Player Selection */}
          {currentTeamId && playersData && (
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg font-semibold mb-4">Player Selection</h2>
              <PlayerSelector
                matchId={matchId}
                teamId={currentTeamId}
                playersData={playersData}
                onBatsmanSelect={setSelectedBatsman}
                onBowlerSelect={setSelectedBowler}
                selectedBatsman={selectedBatsman}
                selectedBowler={selectedBowler}
                selectedBatsman2={selectedBatsman2}
              />
            </Card>
          )}
          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Ball-by-Ball Input</h2>
            <BallInputComponent
              batsmanId={selectedBatsman}
              bowlerId={selectedBowler}
              onBallAdded={persistBallToDB}
            />
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-lg font-semibold mb-4">Voice Input</h2>
            <VoiceInput onCommand={handleVoiceCommand} />
          </Card>

          {/* Current Over */}
          {currentInningsData && (
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">Current Over</h3>
              <div className="flex gap-2 flex-wrap">
                {currentInningsData.balls
                  .filter((b) => b.overNumber === currentInningsData.currentOver)
                  .map((ball) => (
                    <div
                      key={ball.id}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        ball.isWicket
                          ? "bg-red-500 text-white"
                          : ball.isFour
                          ? "bg-orange-500 text-white"
                          : ball.isSix
                          ? "bg-red-600 text-white"
                          : "bg-muted"
                      }`}
                    >
                      {ball.runs}
                      {ball.isWide && "WD"}
                      {ball.isNoBall && "NB"}
                      {ball.isBye && "B"}
                      {ball.isLegBye && "LB"}
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ManhattanChart />
          <WagonWheel />
          <WormChart />
        </div>
      )}
    </div>
  );
}

export default function ScoringPage() {
  return <ScoringInterface />;
}
