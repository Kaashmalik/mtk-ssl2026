"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db, PLAN_LIMITS } from "@mtk/database"
import { type PlanKey } from "@mtk/database"
import { teams, players, tournaments } from "@mtk/database"
import { eq, and, ilike, desc, asc, count } from "drizzle-orm"
import { z } from "zod"
import { getMyTenant } from "@/app/actions/tenants"
import { withAuth } from "./action-guard"

// ─── Validation Schemas ───────────────────────────────────────

const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters").max(100),
  tenantId: z.string().uuid("Invalid tenant ID").optional(),
  shortName: z.string().min(2).max(10).optional().nullable(),
  slug: z.string().min(2).max(50).optional(),
  description: z.string().max(2000).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  bannerUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional().nullable(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color").optional().nullable(),
  jerseyColor: z.string().max(50).optional().nullable(),
  homeGround: z.string().max(200).optional().nullable(),
  foundedYear: z.number().int().min(1800).max(2100).optional().nullable(),
  maxSquadSize: z.number().int().min(5).max(30).default(15).optional(),
  tournamentId: z.string().uuid().optional().nullable(),
})

const updateTeamSchema = createTeamSchema.partial().omit({ tenantId: true })

const teamFiltersSchema = z.object({
  tenantId: z.string().uuid().optional(),
  tournamentId: z.string().uuid().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "createdAt", "city"]).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
export type TeamFilters = z.infer<typeof teamFiltersSchema>

async function requireTenant() {
  const tenant = await getMyTenant()
  if (!tenant) throw new Error("Tenant not found")
  return tenant
}

// ─── Slug Generator ───────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

// ─── Actions ──────────────────────────────────────────────────

export const createTeam = withAuth("team:create", async (input: CreateTeamInput) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()

  // ─── Plan-based team quota check ────────────────────────────────
  const planLimits = PLAN_LIMITS[tenant.plan as PlanKey] ?? PLAN_LIMITS.free
  if (planLimits.maxTeams !== Infinity) {
    const [{ teamCount }] = await db
      .select({ teamCount: count() })
      .from(teams)
      .where(eq(teams.tenantId, tenant.id))

    if (Number(teamCount) >= planLimits.maxTeams) {
      throw new Error(
        `Your ${tenant.plan} plan allows a maximum of ${planLimits.maxTeams} teams. ` +
        `Upgrade your plan to create more teams.`
      )
    }
  }

  const validated = createTeamSchema.parse({
    ...input,
    tenantId: input.tenantId ?? tenant.id,
  })
  const tenantId = validated.tenantId ?? tenant.id
  if (tenantId !== tenant.id) throw new Error("Invalid tenant")
  const slug = validated.slug || generateSlug(validated.name)

  if (validated.tournamentId) {
    const [tournament] = await db.select().from(tournaments)
      .where(and(eq(tournaments.id, validated.tournamentId), eq(tournaments.tenantId, tenant.id)))
      .limit(1)
    if (!tournament) throw new Error("Tournament not found")
  }

  const [team] = await db.insert(teams).values({
    ...validated,
    tenantId,
    slug,
    createdBy: userId,
  }).returning()

  revalidatePath("/dashboard/teams")
  revalidatePath("/dashboard")
  return { success: true, team }
})

export const updateTeam = withAuth("team:update", async (id: string, input: UpdateTeamInput) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()

  const validated = updateTeamSchema.parse(input)
  const cleanData = Object.fromEntries(
    Object.entries(validated).filter(([, v]) => v !== undefined)
  )

  // Regenerate slug if name changes
  if (cleanData.name && !cleanData.slug) {
    cleanData.slug = generateSlug(cleanData.name as string)
  }

  if (cleanData.tournamentId) {
    const [tournament] = await db.select().from(tournaments)
      .where(and(eq(tournaments.id, cleanData.tournamentId as string), eq(tournaments.tenantId, tenant.id)))
      .limit(1)
    if (!tournament) throw new Error("Tournament not found")
  }

  const [team] = await db.update(teams).set({
    ...cleanData,
    updatedAt: new Date(),
  }).where(and(eq(teams.id, id), eq(teams.tenantId, tenant.id))).returning()

  if (!team) throw new Error("Team not found")

  revalidatePath("/dashboard/teams")
  revalidatePath(`/dashboard/teams/${id}`)
  return { success: true, team }
})

export const deleteTeam = withAuth("team:delete", async (id: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()

  await db.delete(teams).where(and(eq(teams.id, id), eq(teams.tenantId, tenant.id)))

  revalidatePath("/dashboard/teams")
  revalidatePath("/dashboard")
  return { success: true }
})

export const getTeam = withAuth("team:read", async (id: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const [team] = await db.select().from(teams)
    .where(and(eq(teams.id, id), eq(teams.tenantId, tenant.id)))
    .limit(1)
  return team ?? null
})

export const getTeamWithRoster = withAuth("team:read", async (id: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const [team] = await db.select().from(teams)
    .where(and(eq(teams.id, id), eq(teams.tenantId, tenant.id)))
    .limit(1)
  if (!team) return null

  const roster = await db.select().from(players)
    .where(and(eq(players.teamId, id), eq(players.tenantId, tenant.id)))
    .orderBy(asc(players.name))

  return { ...team, players: roster }
})

export const getTeams = withAuth("team:read", async (filters: TeamFilters) => {
  const tenant = await requireTenant()
  const validated = teamFiltersSchema.parse({ ...filters, tenantId: tenant.id })
  const { tournamentId, search, isActive, page, pageSize, sortBy, sortOrder } = validated
  const offset = (page - 1) * pageSize

  const conditions = [eq(teams.tenantId, tenant.id)]
  if (tournamentId) conditions.push(eq(teams.tournamentId, tournamentId))
  if (search) conditions.push(ilike(teams.name, `%${search}%`))
  if (isActive !== undefined) conditions.push(eq(teams.isActive, isActive))

  const whereClause = and(...conditions)
  const orderFn = sortOrder === "desc" ? desc : asc
  const orderColumn = sortBy === "name" ? teams.name
    : sortBy === "city" ? teams.city
    : teams.createdAt

  const [data, [{ total }]] = await Promise.all([
    db.select().from(teams)
      .where(whereClause)
      .orderBy(orderFn(orderColumn))
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(teams).where(whereClause),
  ])

  return {
    data,
    pagination: {
      page,
      pageSize,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / pageSize),
    },
  }
})

export const addPlayerToTeam = withAuth("team:manage_roster", async (teamId: string, playerId: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()

  const [team] = await db.select().from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.tenantId, tenant.id)))
    .limit(1)
  if (!team) throw new Error("Team not found")

  const [player] = await db.update(players).set({
    teamId,
    updatedAt: new Date(),
  }).where(and(eq(players.id, playerId), eq(players.tenantId, tenant.id))).returning()

  if (!player) throw new Error("Player not found")

  revalidatePath(`/dashboard/teams/${teamId}`)
  revalidatePath(`/dashboard/players/${playerId}`)
  return { success: true, player }
})

export const removePlayerFromTeam = withAuth("team:manage_roster", async (teamId: string, playerId: string) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()

  const [team] = await db.select().from(teams)
    .where(and(eq(teams.id, teamId), eq(teams.tenantId, tenant.id)))
    .limit(1)
  if (!team) throw new Error("Team not found")

  const [player] = await db.update(players).set({
    teamId: null,
    updatedAt: new Date(),
  }).where(and(eq(players.id, playerId), eq(players.teamId, teamId), eq(players.tenantId, tenant.id))).returning()

  if (!player) throw new Error("Player not found in this team")

  revalidatePath(`/dashboard/teams/${teamId}`)
  revalidatePath(`/dashboard/players/${playerId}`)
  return { success: true }
})
