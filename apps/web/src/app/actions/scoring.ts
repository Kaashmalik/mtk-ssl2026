"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@mtk/database"
import {
  matches, matchInnings, matchBalls, players, teams,
} from "@mtk/database"
import { eq, and, desc, asc } from "drizzle-orm"
import { z } from "zod"
import { getMyTenant } from "@/app/actions/tenants"
import { withAuth } from "./action-guard"
import {
  proxyRecordBall,
  proxyUndoBall,
} from "@/lib/scoring-service-client"

// ─── Schemas ──────────────────────────────────────────────────

const recordBallSchema = z.object({
  matchId: z.string().uuid(),
  inningsId: z.string().uuid(),
  overNumber: z.number().int().min(0),
  ballNumber: z.number().int().min(1).max(6),
  runs: z.number().int().min(0).max(7),
  batsmanId: z.string().uuid().optional().nullable(),
  bowlerId: z.string().uuid().optional().nullable(),
  isWicket: z.boolean().default(false),
  wicketType: z.enum([
    "bowled", "caught", "lbw", "run_out", "stumped", "hit_wicket", "retired", "retired_hurt",
  ]).optional().nullable(),
  isWide: z.boolean().default(false),
  isNoBall: z.boolean().default(false),
  isBye: z.boolean().default(false),
  isLegBye: z.boolean().default(false),
  isFour: z.boolean().default(false),
  isSix: z.boolean().default(false),
})

export type RecordBallInput = z.infer<typeof recordBallSchema>

const createInningsSchema = z.object({
  matchId: z.string().uuid(),
  teamId: z.string().uuid(),
  inningsNumber: z.number().int().min(1).max(3), // 1, 2, or 3 for super over
})

export type CreateInningsInput = z.infer<typeof createInningsSchema>

async function requireTenant() {
  const tenant = await getMyTenant()
  if (!tenant) throw new Error("Tenant not found")
  return tenant
}

// ─── Record Ball ──────────────────────────────────────────────
// Auth + tenant checks here; persistence is Nest scoring-service (SoT).

export const recordBall = withAuth("match:score", async (input: RecordBallInput) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const validated = recordBallSchema.parse(input)

  if (!validated.batsmanId || !validated.bowlerId) {
    throw new Error("Batsman and bowler are required")
  }

  // Verify match belongs to tenant and is scorable
  const [match] = await db.select().from(matches)
    .where(and(eq(matches.id, validated.matchId), eq(matches.tenantId, tenant.id)))
    .limit(1)

  if (!match) throw new Error("Match not found")
  if (match.status === "completed" || match.status === "abandoned" || match.status === "cancelled") {
    throw new Error(`Match is already ${match.status}`)
  }

  const [innings] = await db.select().from(matchInnings)
    .where(and(eq(matchInnings.id, validated.inningsId), eq(matchInnings.matchId, validated.matchId)))
    .limit(1)

  if (!innings) throw new Error("Innings not found")
  if (innings.status === "completed") throw new Error("Innings is already completed")

  let extras: { type: "wide" | "noball" | "bye" | "legbye"; runs: number } | undefined
  if (validated.isWide) extras = { type: "wide", runs: Math.max(1, validated.runs) }
  else if (validated.isNoBall) extras = { type: "noball", runs: Math.max(1, validated.runs) }
  else if (validated.isBye) extras = { type: "bye", runs: validated.runs }
  else if (validated.isLegBye) extras = { type: "legbye", runs: validated.runs }

  const wicket = validated.isWicket && validated.wicketType
    ? { type: validated.wicketType, playerId: validated.batsmanId }
    : undefined

  const result = await proxyRecordBall({
    matchId: validated.matchId,
    inningsId: validated.inningsId,
    over: validated.overNumber,
    ball: validated.ballNumber,
    runs: validated.runs,
    batsmanId: validated.batsmanId,
    bowlerId: validated.bowlerId,
    extras,
    wicket,
  })

  revalidatePath(`/matches/${validated.matchId}/scoring`)
  revalidatePath(`/dashboard/matches/${validated.matchId}`)
  revalidatePath("/dashboard/scoring")

  return {
    success: true,
    ballId: result.ballId,
    scorecard: {
      matchId: validated.matchId,
      inningsId: validated.inningsId,
      innings: result.scorecard.innings,
      totalRuns: result.scorecard.totalRuns,
      totalWickets: result.scorecard.totalWickets,
      overs: result.scorecard.overs,
      balls: result.scorecard.balls,
      runRate: result.scorecard.runRate,
    },
  }
})

// ─── Undo Ball ────────────────────────────────────────────────
// Auth here; undo rules enforced by scoring-service SoT.

export const undoBall = withAuth("match:score", async (matchId: string, ballId: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()

  const [match] = await db.select({ id: matches.id }).from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.tenantId, tenant.id)))
    .limit(1)
  if (!match) throw new Error("Match not found")

  await proxyUndoBall(matchId, ballId)

  revalidatePath(`/matches/${matchId}/scoring`)
  revalidatePath(`/dashboard/matches/${matchId}`)

  return { success: true }
})

// ─── Create Innings ───────────────────────────────────────────

export const createInnings = withAuth("match:score", async (input: CreateInningsInput) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const validated = createInningsSchema.parse(input)

  // Verify match
  const [match] = await db.select().from(matches)
    .where(and(eq(matches.id, validated.matchId), eq(matches.tenantId, tenant.id)))
    .limit(1)
  if (!match) throw new Error("Match not found")

  // Verify team belongs to match
  if (validated.teamId !== match.teamAId && validated.teamId !== match.teamBId) {
    throw new Error("Team does not belong to this match")
  }

  // Check for existing innings with same number
  const existing = await db.select({ id: matchInnings.id }).from(matchInnings)
    .where(and(
      eq(matchInnings.matchId, validated.matchId),
      eq(matchInnings.inningsNumber, validated.inningsNumber),
    ))
    .limit(1)

  if (existing.length > 0) throw new Error(`Innings ${validated.inningsNumber} already exists`)

  const [innings] = await db.insert(matchInnings).values({
    tenantId: tenant.id,
    matchId: validated.matchId,
    teamId: validated.teamId,
    inningsNumber: validated.inningsNumber,
    status: "not_started",
  }).returning()

  revalidatePath(`/matches/${validated.matchId}/scoring`)

  return { success: true, innings }
})

// ─── Get Match State (for scoring page) ───────────────────────
// Returns match + both teams + all innings + recent balls. Single query batch.

export const getMatchForScoring = withAuth("match:read", async (matchId: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()

  // Batch: match + teams + innings + last 30 balls per innings
  const [match] = await db.select().from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.tenantId, tenant.id)))
    .limit(1)

  if (!match) throw new Error("Match not found")

  const [teamA, teamB, allInnings, recentBalls] = await Promise.all([
    db.select({ id: teams.id, name: teams.name }).from(teams)
      .where(eq(teams.id, match.teamAId)).limit(1),
    db.select({ id: teams.id, name: teams.name }).from(teams)
      .where(eq(teams.id, match.teamBId)).limit(1),
    db.select().from(matchInnings)
      .where(eq(matchInnings.matchId, matchId))
      .orderBy(asc(matchInnings.inningsNumber)),
    db.select().from(matchBalls)
      .where(eq(matchBalls.matchId, matchId))
      .orderBy(desc(matchBalls.createdAt))
      .limit(60),
  ])

  return {
    match: {
      id: match.id,
      status: match.status,
      matchFormat: match.matchFormat,
      totalOvers: match.totalOvers,
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      tossWinnerId: match.tossWinnerId,
      tossDecision: match.tossDecision,
    },
    teamA: teamA[0] ?? { id: match.teamAId, name: "Team A" },
    teamB: teamB[0] ?? { id: match.teamBId, name: "Team B" },
    innings: allInnings,
    recentBalls: recentBalls.reverse(), // chronological order
  }
})

// ─── Get Players for Scoring ──────────────────────────────────
// Returns both teams' players for the player selector.

export const getMatchPlayersForScoring = withAuth("match:read", async (matchId: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()

  const [match] = await db.select({ teamAId: matches.teamAId, teamBId: matches.teamBId })
    .from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.tenantId, tenant.id)))
    .limit(1)

  if (!match) throw new Error("Match not found")

  const [teamAPlayers, teamBPlayers] = await Promise.all([
    db.select({ id: players.id, name: players.name, role: players.role })
      .from(players)
      .where(and(eq(players.teamId, match.teamAId), eq(players.tenantId, tenant.id)))
      .orderBy(asc(players.name)),
    db.select({ id: players.id, name: players.name, role: players.role })
      .from(players)
      .where(and(eq(players.teamId, match.teamBId), eq(players.tenantId, tenant.id)))
      .orderBy(asc(players.name)),
  ])

  return {
    teamA: teamAPlayers,
    teamB: teamBPlayers,
  }
})

// ─── Complete Innings ─────────────────────────────────────────

export const completeInnings = withAuth("match:score", async (matchId: string, inningsId: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()

  const [updated] = await db.update(matchInnings)
    .set({ status: "completed", updatedAt: new Date() })
    .where(and(eq(matchInnings.id, inningsId), eq(matchInnings.matchId, matchId)))
    .returning()

  if (!updated) throw new Error("Innings not found")

  // Check if match should move to innings_break
  const [match] = await db.select().from(matches)
    .where(and(eq(matches.id, matchId), eq(matches.tenantId, tenant.id)))
    .limit(1)

  if (match && match.status === "live" && updated.inningsNumber === 1) {
    await db.update(matches)
      .set({ status: "innings_break", updatedAt: new Date() })
      .where(eq(matches.id, matchId))
  }

  revalidatePath(`/matches/${matchId}/scoring`)
  revalidatePath(`/dashboard/matches/${matchId}`)

  return { success: true, innings: updated }
})

// ─── Get Ball History ─────────────────────────────────────────

export const getBallHistory = withAuth("match:read", async (matchId: string, inningsId: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  return db.select().from(matchBalls)
    .where(and(eq(matchBalls.matchId, matchId), eq(matchBalls.inningsId, inningsId)))
    .orderBy(asc(matchBalls.overNumber), asc(matchBalls.ballNumber))
})
