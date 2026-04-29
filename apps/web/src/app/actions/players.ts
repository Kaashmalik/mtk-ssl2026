"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@mtk/database"
import { players } from "@mtk/database"
import { eq } from "drizzle-orm"
import { z } from "zod"

const createPlayerSchema = z.object({
  name: z.string().min(2, "Player name must be at least 2 characters").max(100),
  role: z.enum(["batsman", "bowler", "all_rounder", "wicketkeeper"]).optional(),
  battingStyle: z.enum(["right_hand", "left_hand"]).optional(),
  bowlingStyle: z.enum(["right_arm_fast", "right_arm_medium", "left_arm_fast", "left_arm_medium", "right_arm_spin", "left_arm_spin"]).optional(),
  jerseyNumber: z.number().int().min(0).max(999).optional(),
  teamId: z.string().uuid().optional(),
  tenantId: z.string().uuid().optional(),
  photoUrl: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
  phone: z.string().optional(),
})

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>

export async function createPlayer(input: CreatePlayerInput) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = createPlayerSchema.parse(input)

  const [player] = await db.insert(players).values({
    ...validated,
    createdBy: userId,
  }).returning()

  revalidatePath("/dashboard/players")
  revalidatePath("/dashboard")
  return { success: true, player }
}

export async function updatePlayer(id: string, input: Partial<CreatePlayerInput>) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const [player] = await db.update(players).set({
    ...input,
    updatedAt: new Date(),
  }).where(eq(players.id, id)).returning()

  revalidatePath("/dashboard/players")
  revalidatePath(`/dashboard/players/${id}`)
  return { success: true, player }
}

export async function deletePlayer(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  await db.delete(players).where(eq(players.id, id))

  revalidatePath("/dashboard/players")
  revalidatePath("/dashboard")
  return { success: true }
}
