import { db } from "@mtk/database"
import { players } from "@mtk/database"
import { eq, desc, ilike, count, and } from "drizzle-orm"

export async function getPlayers(tenantId?: string, search?: string, teamId?: string) {
  const conditions = []
  if (tenantId) conditions.push(eq(players.tenantId, tenantId))
  if (search) conditions.push(ilike(players.name, `%${search}%`))
  if (teamId) conditions.push(eq(players.teamId, teamId))

  return db
    .select()
    .from(players)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(players.createdAt))
}

export async function getPlayerById(id: string) {
  const [player] = await db.select().from(players).where(eq(players.id, id)).limit(1)
  return player ?? null
}

export async function getPlayerCount(tenantId?: string) {
  const [result] = await db
    .select({ count: count() })
    .from(players)
    .where(tenantId ? eq(players.tenantId, tenantId) : undefined)
  return result?.count ?? 0
}
