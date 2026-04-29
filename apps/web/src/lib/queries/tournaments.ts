import { db } from "@mtk/database"
import { tournaments } from "@mtk/database"
import { eq, desc, and, count } from "drizzle-orm"

export async function getTournaments(tenantId?: string) {
  return db
    .select()
    .from(tournaments)
    .where(tenantId ? eq(tournaments.tenantId, tenantId) : undefined)
    .orderBy(desc(tournaments.createdAt))
}

export async function getTournamentById(id: string) {
  const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1)
  return tournament ?? null
}

export async function getActiveTournaments(tenantId?: string) {
  return db
    .select()
    .from(tournaments)
    .where(
      and(
        eq(tournaments.status, "active"),
        tenantId ? eq(tournaments.tenantId, tenantId) : undefined
      )
    )
    .orderBy(desc(tournaments.createdAt))
}
