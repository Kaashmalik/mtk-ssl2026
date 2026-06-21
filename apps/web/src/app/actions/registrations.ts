"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@mtk/database"
import { leagueRegistrations, teams, tournaments } from "@mtk/database"
import { eq, and, desc } from "drizzle-orm"
import { z } from "zod"
import { getMyTenant } from "@/app/actions/tenants"
import { withAuth } from "./action-guard"


const registerTeamSchema = z.object({
  tenantId: z.string().uuid().optional(),
  tournamentId: z.string().uuid(),
  teamId: z.string().uuid(),
  squadPlayerIds: z.array(z.string().uuid()).min(1, "Select at least 1 player").max(30),
  registrationFee: z.string().optional().default("0"),
  notes: z.string().max(500).optional().nullable(),
})

export type RegisterTeamInput = z.infer<typeof registerTeamSchema>

async function requireTenant() {
  const tenant = await getMyTenant()
  if (!tenant) throw new Error("Tenant not found")
  return tenant
}

export const registerTeam = withAuth("registration:create", async (input: RegisterTeamInput) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const validated = registerTeamSchema.parse({
    ...input,
    tenantId: input.tenantId ?? tenant.id,
  })
  const tenantId = validated.tenantId ?? tenant.id
  if (tenantId !== tenant.id) throw new Error("Invalid tenant")

  const [team] = await db.select().from(teams)
    .where(and(eq(teams.id, validated.teamId), eq(teams.tenantId, tenant.id)))
    .limit(1)
  if (!team) throw new Error("Team not found")

  const [tournament] = await db.select().from(tournaments)
    .where(and(eq(tournaments.id, validated.tournamentId), eq(tournaments.tenantId, tenant.id)))
    .limit(1)
  if (!tournament) throw new Error("Tournament not found")

  // Check for duplicate registration
  const existing = await db.select().from(leagueRegistrations)
    .where(and(
      eq(leagueRegistrations.teamId, validated.teamId),
      eq(leagueRegistrations.tournamentId, validated.tournamentId),
      eq(leagueRegistrations.tenantId, tenant.id)
    ))
    .limit(1)
  if (existing.length > 0) throw new Error("Team is already registered for this tournament")

  const [reg] = await db.insert(leagueRegistrations).values({
    ...validated,
    tenantId,
    registeredBy: userId,
    status: "pending",
    paymentStatus: "unpaid",
  }).returning()

  revalidatePath(`/dashboard/tournaments/${validated.tournamentId}`)
  return { success: true, registration: reg }
})

export const approveRegistration = withAuth("registration:manage", async (registrationId: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const [reg] = await db.update(leagueRegistrations).set({
    status: "approved", approvedBy: userId, approvedAt: new Date(), updatedAt: new Date(),
  }).where(and(eq(leagueRegistrations.id, registrationId), eq(leagueRegistrations.tenantId, tenant.id))).returning()
  if (!reg) throw new Error("Registration not found")
  revalidatePath(`/dashboard/tournaments/${reg.tournamentId}`)
  return { success: true, registration: reg }
})

export const rejectRegistration = withAuth("registration:manage", async (registrationId: string, reason?: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const [reg] = await db.update(leagueRegistrations).set({
    status: "rejected", rejectionReason: reason ?? null, updatedAt: new Date(),
  }).where(and(eq(leagueRegistrations.id, registrationId), eq(leagueRegistrations.tenantId, tenant.id))).returning()
  if (!reg) throw new Error("Registration not found")
  revalidatePath(`/dashboard/tournaments/${reg.tournamentId}`)
  return { success: true, registration: reg }
})

export const getRegistrations = withAuth("registration:manage", async (tournamentId: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  return db.select().from(leagueRegistrations)
    .where(and(eq(leagueRegistrations.tournamentId, tournamentId), eq(leagueRegistrations.tenantId, tenant.id)))
    .orderBy(desc(leagueRegistrations.createdAt))
})

export const getMyRegistrations = withAuth("registration:create", async (tenantId: string) => {
  const { userId } = await auth()
  if (!userId) return []
  const tenant = await requireTenant()
  if (tenantId !== tenant.id) throw new Error("Invalid tenant")
  return db.select().from(leagueRegistrations)
    .where(and(eq(leagueRegistrations.tenantId, tenant.id), eq(leagueRegistrations.registeredBy, userId)))
    .orderBy(desc(leagueRegistrations.createdAt))
})
