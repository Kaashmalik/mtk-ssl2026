"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@mtk/database"
import {
  matches, matchInnings, matchBalls, players, teams,
  type NewMatchBall,
} from "@mtk/database"
import { eq, and, desc, asc, sql } from "drizzle-orm"
import { z } from "zod"
import { getMyTenant } from "@/app/actions/tenants"
import { withAuth } from "./action-guard"

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
// Atomic: inserts ball, updates innings aggregates, transitions match status.

export const recordBall = withAuth("match:score", async (input: RecordBallInput) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const validated = recordBallSchema.parse(input)

  return await db.transaction(async (tx) => {
    // 1. Verify match belongs to tenant and is scorable
    const [match] = await tx.select().from(matches)
      .where(and(eq(matches.id, validated.matchId), eq(matches.tenantId, tenant.id)))
      .limit(1)

    if (!match) throw new Error("Match not found")
    if (match.status === "completed" || match.status === "abandoned" || match.status === "cancelled") {
      throw new Error(`Match is already ${match.status}`)
    }

    // 2. Verify innings exists
    const [innings] = await tx.select().from(matchInnings)
      .where(and(eq(matchInnings.id, validated.inningsId), eq(matchInnings.matchId, validated.matchId)))
      .limit(1)

    if (!innings) throw new Error("Innings not found")
    if (innings.status === "completed") throw new Error("Innings is already completed")

    // 3. Determine ball properties
    const isWide = validated.isWide
    const isNoBall = validated.isNoBall
    const isBye = validated.isBye
    const isLegBye = validated.isLegBye
    const isWicket = validated.isWicket
    const totalRuns = validated.runs
    const isFour = validated.isFour || (totalRuns === 4 && !isWide && !isNoBall && !isBye && !isLegBye)
    const isSix = validated.isSix || (totalRuns === 6 && !isWide && !isNoBall && !isBye && !isLegBye)

    // 4. Insert the ball record
    const ballInsert: NewMatchBall = {
      tenantId: tenant.id,
      matchId: validated.matchId,
      inningsId: validated.inningsId,
      overNumber: validated.overNumber,
      ballNumber: validated.ballNumber,
      bowlerId: validated.bowlerId || null,
      batsmanId: validated.batsmanId || null,
      runs: validated.runs,
      isWicket,
      wicketType: isWicket ? (validated.wicketType as NewMatchBall["wicketType"]) : null,
      isFour,
      isSix,
      isWide,
      isNoBall,
      isBye,
      isLegBye,
      shotDirection: null,
      shotType: null,
    }

    const [insertedBall] = await tx.insert(matchBalls)
      .values(ballInsert)
      .returning()

    // 5. Update innings aggregates incrementally (O(1))
    const extrasRuns = (isWide || isNoBall) ? validated.runs : 0
    const byesRuns = isBye ? validated.runs : 0
    const legByesRuns = isLegBye ? validated.runs : 0

    await tx.update(matchInnings)
      .set({
        totalRuns: sql`${matchInnings.totalRuns} + ${totalRuns}`,
        totalWickets: sql`${matchInnings.totalWickets} + ${isWicket ? 1 : 0}`,
        totalBalls: sql`${matchInnings.totalBalls} + ${(!isWide && !isNoBall) ? 1 : 0}`,
        extras: sql`${matchInnings.extras} + ${extrasRuns}`,
        byes: sql`${matchInnings.byes} + ${byesRuns}`,
        legByes: sql`${matchInnings.legByes} + ${legByesRuns}`,
        wides: sql`${matchInnings.wides} + ${isWide ? 1 : 0}`,
        noBalls: sql`${matchInnings.noBalls} + ${isNoBall ? 1 : 0}`,
        status: "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(matchInnings.id, validated.inningsId))

    // 6. Auto-start match if still scheduled
    if (match.status === "scheduled" || match.status === "toss") {
      await tx.update(matches)
        .set({ status: "live", startDate: new Date(), updatedAt: new Date() })
        .where(eq(matches.id, validated.matchId))
    }

    // 7. Fetch updated innings for response
    const [updatedInnings] = await tx.select().from(matchInnings)
      .where(eq(matchInnings.id, validated.inningsId))
      .limit(1)

    if (!updatedInnings) throw new Error("Innings disappeared during transaction")

    const totalBalls = updatedInnings.totalBalls
    const overs = Math.floor(totalBalls / 6)
    const ballsInOver = totalBalls % 6
    const runRate = totalBalls > 0 ? Number((updatedInnings.totalRuns / (totalBalls / 6)).toFixed(2)) : 0

    revalidatePath(`/matches/${validated.matchId}/scoring`)
    revalidatePath(`/dashboard/matches/${validated.matchId}`)
    revalidatePath("/dashboard/scoring")

    return {
      success: true,
      ballId: insertedBall.id,
      scorecard: {
        matchId: validated.matchId,
        inningsId: validated.inningsId,
        innings: updatedInnings.inningsNumber,
        totalRuns: updatedInnings.totalRuns,
        totalWickets: updatedInnings.totalWickets,
        overs,
        balls: ballsInOver,
        runRate,
        extras: updatedInnings.extras,
        wides: updatedInnings.wides,
        noBalls: updatedInnings.noBalls,
        byes: updatedInnings.byes,
        legByes: updatedInnings.legByes,
      },
    }
  })
})

// ─── Undo Ball ────────────────────────────────────────────────
// Only the last recorded ball in an innings can be undone, within 5 minutes.

export const undoBall = withAuth("match:score", async (matchId: string, ballId: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  return await db.transaction(async (tx) => {
    // 1. Find the ball
    const [ball] = await tx.select().from(matchBalls)
      .where(and(eq(matchBalls.id, ballId), eq(matchBalls.matchId, matchId)))
      .limit(1)

    if (!ball) throw new Error("Ball not found")

    // 2. Verify it's the last ball
    const [lastBall] = await tx.select({ id: matchBalls.id }).from(matchBalls)
      .where(eq(matchBalls.inningsId, ball.inningsId))
      .orderBy(desc(matchBalls.createdAt))
      .limit(1)

    if (!lastBall || lastBall.id !== ballId) {
      throw new Error("Only the last recorded ball can be undone")
    }

    // 3. Time window check (5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (ball.createdAt < fiveMinutesAgo) {
      throw new Error("Cannot undo a ball recorded more than 5 minutes ago")
    }

    // 4. Verify innings not completed
    const [innings] = await tx.select().from(matchInnings)
      .where(eq(matchInnings.id, ball.inningsId))
      .limit(1)

    if (!innings) throw new Error("Innings not found")
    if (innings.status === "completed") throw new Error("Cannot undo balls in a completed innings")

    // 5. Delete the ball
    await tx.delete(matchBalls).where(eq(matchBalls.id, ballId))

    // 6. Decrement innings aggregates
    const totalRuns = ball.runs
    const extrasRuns = (ball.isWide || ball.isNoBall) ? 1 : 0
    const byesRuns = ball.isBye ? ball.runs : 0
    const legByesRuns = ball.isLegBye ? ball.runs : 0

    await tx.update(matchInnings)
      .set({
        totalRuns: sql`GREATEST(0, ${matchInnings.totalRuns} - ${totalRuns})`,
        totalWickets: sql`GREATEST(0, ${matchInnings.totalWickets} - ${ball.isWicket ? 1 : 0})`,
        totalBalls: sql`GREATEST(0, ${matchInnings.totalBalls} - ${(!ball.isWide && !ball.isNoBall) ? 1 : 0})`,
        extras: sql`GREATEST(0, ${matchInnings.extras} - ${extrasRuns})`,
        byes: sql`GREATEST(0, ${matchInnings.byes} - ${byesRuns})`,
        legByes: sql`GREATEST(0, ${matchInnings.legByes} - ${legByesRuns})`,
        wides: sql`GREATEST(0, ${matchInnings.wides} - ${ball.isWide ? 1 : 0})`,
        noBalls: sql`GREATEST(0, ${matchInnings.noBalls} - ${ball.isNoBall ? 1 : 0})`,
        updatedAt: new Date(),
      })
      .where(eq(matchInnings.id, ball.inningsId))

    // 7. Fetch updated innings
    const [updatedInnings] = await tx.select().from(matchInnings)
      .where(eq(matchInnings.id, ball.inningsId))
      .limit(1)

    if (!updatedInnings) throw new Error("Innings disappeared during undo transaction")

    const totalBalls = updatedInnings.totalBalls
    const runRate = totalBalls > 0 ? Number((updatedInnings.totalRuns / (totalBalls / 6)).toFixed(2)) : 0

    revalidatePath(`/matches/${matchId}/scoring`)
    revalidatePath(`/dashboard/matches/${matchId}`)

    return {
      success: true,
      scorecard: {
        matchId,
        inningsId: ball.inningsId,
        innings: updatedInnings.inningsNumber,
        totalRuns: updatedInnings.totalRuns,
        totalWickets: updatedInnings.totalWickets,
        overs: Math.floor(totalBalls / 6),
        balls: totalBalls % 6,
        runRate,
        extras: updatedInnings.extras,
        wides: updatedInnings.wides,
        noBalls: updatedInnings.noBalls,
        byes: updatedInnings.byes,
        legByes: updatedInnings.legByes,
      },
    }
  })
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
