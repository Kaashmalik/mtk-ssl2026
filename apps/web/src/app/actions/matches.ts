"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@mtk/database"
import { matches } from "@mtk/database"
import { eq } from "drizzle-orm"
import { z } from "zod"

const createMatchSchema = z.object({
  tournamentId: z.string().uuid().optional(),
  team1Id: z.string().uuid(),
  team2Id: z.string().uuid(),
  venueId: z.string().uuid().optional(),
  format: z.enum(["t20", "odi", "test", "t10", "custom"]),
  totalOvers: z.number().int().min(1).max(450),
  scheduledAt: z.string().datetime(),
  tenantId: z.string().uuid().optional(),
})

export type CreateMatchInput = z.infer<typeof createMatchSchema>

export async function createMatch(input: CreateMatchInput) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = createMatchSchema.parse(input)

  const [match] = await db.insert(matches).values({
    ...validated,
    status: "scheduled",
    createdBy: userId,
  }).returning()

  revalidatePath("/dashboard/matches")
  revalidatePath("/dashboard")
  return { success: true, match }
}

export async function updateMatchStatus(id: string, status: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const [match] = await db.update(matches).set({
    status,
    updatedAt: new Date(),
  }).where(eq(matches.id, id)).returning()

  revalidatePath("/dashboard/matches")
  revalidatePath(`/dashboard/matches/${id}`)
  return { success: true, match }
}

export async function deleteMatch(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  await db.delete(matches).where(eq(matches.id, id))

  revalidatePath("/dashboard/matches")
  revalidatePath("/dashboard")
  return { success: true }
}
