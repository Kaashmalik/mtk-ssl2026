"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@mtk/database"
import { tournaments } from "@mtk/database"
import { eq } from "drizzle-orm"
import { z } from "zod"

const createTournamentSchema = z.object({
  name: z.string().min(2).max(200),
  format: z.enum(["knockout", "round_robin", "group_knockout", "custom"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  maxTeams: z.number().int().min(2).max(128).optional(),
  oversPerMatch: z.number().int().min(1).max(450).optional(),
  tenantId: z.string().uuid().optional(),
  description: z.string().max(2000).optional(),
})

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>

export async function createTournament(input: CreateTournamentInput) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = createTournamentSchema.parse(input)

  const [tournament] = await db.insert(tournaments).values({
    ...validated,
    status: "draft",
    createdBy: userId,
  }).returning()

  revalidatePath("/dashboard/tournaments")
  revalidatePath("/dashboard")
  return { success: true, tournament }
}

export async function updateTournament(id: string, input: Partial<CreateTournamentInput>) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const [tournament] = await db.update(tournaments).set({
    ...input,
    updatedAt: new Date(),
  }).where(eq(tournaments.id, id)).returning()

  revalidatePath("/dashboard/tournaments")
  revalidatePath(`/dashboard/tournaments/${id}`)
  return { success: true, tournament }
}

export async function deleteTournament(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  await db.delete(tournaments).where(eq(tournaments.id, id))

  revalidatePath("/dashboard/tournaments")
  revalidatePath("/dashboard")
  return { success: true }
}
