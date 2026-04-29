import { db } from "@mtk/database"
import { teams } from "@mtk/database"
import { eq, desc, ilike, count, and } from "drizzle-orm"

export async function getTeams(tenantId?: string, search?: string) {
  const conditions = []
  if (tenantId) conditions.push(eq(teams.tenantId, tenantId))
  if (search) conditions.push(ilike(teams.name, `%${search}%`))

  return db
    .select()
    .from(teams)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(teams.createdAt))
}

export async function getTeamById(id: string) {
  const [team] = await db.select().from(teams).where(eq(teams.id, id)).limit(1)
  return team ?? null
}

export async function getTeamCount(tenantId?: string) {
  const [result] = await db
    .select({ count: count() })
    .from(teams)
    .where(tenantId ? eq(teams.tenantId, tenantId) : undefined)
  return result?.count ?? 0
}
