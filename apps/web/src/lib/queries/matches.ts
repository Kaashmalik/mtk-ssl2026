import { db } from "@mtk/database"
import { matches } from "@mtk/database"
import { eq, desc, and, count } from "drizzle-orm"

export async function getMatches(tenantId?: string, status?: string) {
  const conditions = []
  if (tenantId) conditions.push(eq(matches.tenantId, tenantId))
  if (status) conditions.push(eq(matches.status, status))

  return db
    .select()
    .from(matches)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(matches.createdAt))
}

export async function getMatchById(id: string) {
  const [match] = await db.select().from(matches).where(eq(matches.id, id)).limit(1)
  return match ?? null
}

export async function getLiveMatches(tenantId?: string) {
  return db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.status, "in_progress"),
        tenantId ? eq(matches.tenantId, tenantId) : undefined
      )
    )
    .orderBy(desc(matches.createdAt))
}
