import { db } from "@mtk/database"
import { teams, players, tournaments, matches } from "@mtk/database"
import { eq, count, desc, and, sql, gte } from "drizzle-orm"

export async function getDashboardStats(tenantId?: string) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [teamCount] = await db
    .select({ count: count() })
    .from(teams)
    .where(tenantId ? eq(teams.tenantId, tenantId) : undefined)

  const [playerCount] = await db
    .select({ count: count() })
    .from(players)
    .where(tenantId ? eq(players.tenantId, tenantId) : undefined)

  const [tournamentCount] = await db
    .select({ count: count() })
    .from(tournaments)
    .where(tenantId ? eq(tournaments.tenantId, tenantId) : undefined)

  const [matchCount] = await db
    .select({ count: count() })
    .from(matches)
    .where(tenantId ? eq(matches.tenantId, tenantId) : undefined)

  const [activeMatchCount] = await db
    .select({ count: count() })
    .from(matches)
    .where(
      and(
        eq(matches.status, "in_progress"),
        tenantId ? eq(matches.tenantId, tenantId) : undefined
      )
    )

  const recentMatches = await db
    .select()
    .from(matches)
    .where(tenantId ? eq(matches.tenantId, tenantId) : undefined)
    .orderBy(desc(matches.createdAt))
    .limit(5)

  const upcomingMatches = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.status, "scheduled"),
        tenantId ? eq(matches.tenantId, tenantId) : undefined
      )
    )
    .orderBy(matches.scheduledAt)
    .limit(5)

  return {
    totalTeams: teamCount?.count ?? 0,
    totalPlayers: playerCount?.count ?? 0,
    totalTournaments: tournamentCount?.count ?? 0,
    totalMatches: matchCount?.count ?? 0,
    activeMatches: activeMatchCount?.count ?? 0,
    recentMatches,
    upcomingMatches,
  }
}
