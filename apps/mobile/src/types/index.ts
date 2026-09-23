export interface Match {
  id: string;
  tenantId?: string;
  tournamentId?: string;
  team1Id?: string;
  team2Id?: string;
  teamAId?: string;
  teamBId?: string;
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
  team1Wickets?: number;
  team2Wickets?: number;
  team1Overs?: number;
  team2Overs?: number;
  status: "scheduled" | "toss" | "live" | "innings_break" | "completed" | "abandoned" | "cancelled" | "no_result";
  scheduledDate?: string;
  scheduled_date?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  venue?: string;
  tossWinner?: string;
  tossDecision?: "bat" | "bowl";
  winnerId?: string;
}

export interface Player {
  id: string;
  name: string;
  teamId?: string;
  teamName?: string;
  jerseyNumber?: number;
  role?: string;
  battingStyle?: string;
  bowlingStyle?: string;
}

export interface BallData {
  id: string;
  matchId: string;
  innings: number;
  over: number;
  ball: number;
  runs: number;
  isWicket: boolean;
  wicketType?: string;
  batsmanId?: string;
  bowlerId?: string;
  timestamp: number;
  synced: boolean;
}
