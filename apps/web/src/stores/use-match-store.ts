import { create } from "zustand";

interface Player {
  id: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
}

interface Bowler {
  id: string;
  overs: number;
  runs: number;
  wickets: number;
  maidens: number;
}

interface MatchState {
  matchId: string;
  totalRuns: number;
  wickets: number;
  overs: number;
  striker: Player | null;
  nonStriker: Player | null;
  currentBowler: Bowler | null;
  currentOverBalls: string[];

  initMatch: (matchId: string, team1: string, team2: string) => void;
  addRun: (runs: number) => void;
  addWicket: (type: string) => void;
  undoLastBall: () => void;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matchId: "",
  totalRuns: 0,
  wickets: 0,
  overs: 0,
  striker: null,
  nonStriker: null,
  currentBowler: null,
  currentOverBalls: [],

  initMatch: (matchId, team1, team2) => {
    set({ matchId, totalRuns: 0, wickets: 0, overs: 0, currentOverBalls: [] });
  },

  addRun: (runs) => {
    const state = get();
    const ball = runs === 0 ? "0" : String(runs);
    const newBalls = [...state.currentOverBalls, ball];
    
    // Update overs
    const ballsInOver = newBalls.length % 6;
    const completedOvers = Math.floor(newBalls.length / 6);
    const overs = completedOvers + (ballsInOver > 0 ? ballsInOver / 10 : 0);

    set({
      totalRuns: state.totalRuns + runs,
      currentOverBalls: newBalls,
      overs: Math.round(overs * 10) / 10,
    });
  },

  addWicket: () => {
    const state = get();
    const newBalls = [...state.currentOverBalls, "W"];
    
    // Update overs
    const ballsInOver = newBalls.length % 6;
    const completedOvers = Math.floor(newBalls.length / 6);
    const overs = completedOvers + (ballsInOver > 0 ? ballsInOver / 10 : 0);

    set({
      wickets: state.wickets + 1,
      currentOverBalls: newBalls,
      overs: Math.round(overs * 10) / 10,
    });
  },

  undoLastBall: () => {
    const state = get();
    if (state.currentOverBalls.length === 0) return;
    
    const lastBall = state.currentOverBalls[state.currentOverBalls.length - 1];
    const newBalls = state.currentOverBalls.slice(0, -1);
    
    const runs = lastBall === "W" ? 0 : parseInt(lastBall) || 0;
    const isWicket = lastBall === "W";

    // Update overs
    const ballsInOver = newBalls.length % 6;
    const completedOvers = Math.floor(newBalls.length / 6);
    const overs = completedOvers + (ballsInOver > 0 ? ballsInOver / 10 : 0);

    set({
      totalRuns: Math.max(0, state.totalRuns - runs),
      wickets: isWicket ? Math.max(0, state.wickets - 1) : state.wickets,
      currentOverBalls: newBalls,
      overs: Math.round(overs * 10) / 10,
    });
  },
}));
