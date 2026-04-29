"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@mtk/database"
import { teams } from "@mtk/database"
import { eq } from "drizzle-orm"
import { z } from "zod"

const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(100),
  shortName: z.string().min(2).max(10).optional(),
  city: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  tenantId: z.string().uuid().optional(),
})

const updateTeamSchema = createTeamSchema.partial().extend({
  id: z.string().uuid(),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>

export async function createTeam(input: CreateTeamInput) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = createTeamSchema.parse(input)

  const [team] = await db.insert(teams).values({
    ...validated,
    createdBy: userId,
  }).returning()

  revalidatePath("/dashboard/teams")
  revalidatePath("/dashboard")
  return { success: true, team }
}

export async function updateTeam(input: UpdateTeamInput) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = updateTeamSchema.parse(input)
  const { id, ...data } = validated

  const [team] = await db.update(teams).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(teams.id, id)).returning()

  revalidatePath("/dashboard/teams")
  revalidatePath(`/dashboard/teams/${id}`)
  return { success: true, team }
}

export async function deleteTeam(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  await db.delete(teams).where(eq(teams.id, id))

  revalidatePath("/dashboard/teams")
  revalidatePath("/dashboard")
  return { success: true }
}
