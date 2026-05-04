"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@mtk/database"
import { tournaments } from "@mtk/database"
import { eq, and, ilike, desc, asc, count } from "drizzle-orm"
import { z } from "zod"
import { getMyTenant } from "@/app/actions/tenants"

const createTournamentSchema = z.object({
  name: z.string().min(2).max(200),
  tenantId: z.string().uuid().optional(),
  slug: z.string().min(2).max(100).optional(),
  description: z.string().max(5000).optional().nullable(),
  format: z.enum(["knockout", "league", "hybrid", "round_robin"]),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  registrationDeadline: z.string().optional().nullable(),
  registrationOpen: z.boolean().default(false),
  maxTeams: z.number().int().min(2).max(128).optional().nullable(),
  status: z.enum(["draft", "registration", "live", "completed", "cancelled"]).default("draft"),
})

const updateTournamentSchema = createTournamentSchema.partial().omit({ tenantId: true })

const tournamentFiltersSchema = z.object({
  tenantId: z.string().uuid().optional(),
  status: z.enum(["draft", "registration", "live", "completed", "cancelled"]).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["name", "createdAt", "startDate"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export type CreateTournamentInput = z.input<typeof createTournamentSchema>
export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>
export type TournamentFilters = z.infer<typeof tournamentFiltersSchema>

async function requireTenant() {
  const tenant = await getMyTenant()
  if (!tenant) throw new Error("Tenant not found")
  return tenant
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

export async function createTournament(input: CreateTournamentInput) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const validated = createTournamentSchema.parse({
    ...input,
    tenantId: input.tenantId ?? tenant.id,
  })
  if (validated.tenantId !== tenant.id) throw new Error("Invalid tenant")
  const slug = validated.slug || generateSlug(validated.name)
  const [tournament] = await db.insert(tournaments).values({ ...validated, slug, createdBy: userId }).returning()
  revalidatePath("/dashboard/tournaments")
  revalidatePath("/dashboard")
  return { success: true, tournament }
}

export async function updateTournament(id: string, input: UpdateTournamentInput) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const validated = updateTournamentSchema.parse(input)
  const cleanData = Object.fromEntries(Object.entries(validated).filter(([, v]) => v !== undefined))
  if (cleanData.name && !cleanData.slug) cleanData.slug = generateSlug(cleanData.name as string)
  const [tournament] = await db.update(tournaments).set({ ...cleanData, updatedAt: new Date() })
    .where(and(eq(tournaments.id, id), eq(tournaments.tenantId, tenant.id)))
    .returning()
  if (!tournament) throw new Error("Tournament not found")
  revalidatePath("/dashboard/tournaments")
  revalidatePath(`/dashboard/tournaments/${id}`)
  return { success: true, tournament }
}

export async function deleteTournament(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  await db.delete(tournaments).where(and(eq(tournaments.id, id), eq(tournaments.tenantId, tenant.id)))
  revalidatePath("/dashboard/tournaments")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function getTournament(id: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const [tournament] = await db.select().from(tournaments)
    .where(and(eq(tournaments.id, id), eq(tournaments.tenantId, tenant.id)))
    .limit(1)
  return tournament ?? null
}

export async function getTournaments(filters: TournamentFilters) {
  const tenant = await requireTenant()
  const validated = tournamentFiltersSchema.parse({ ...filters, tenantId: tenant.id })
  const { status, search, page, pageSize, sortBy, sortOrder } = validated
  const offset = (page - 1) * pageSize
  const conditions = [eq(tournaments.tenantId, tenant.id)]
  if (status) conditions.push(eq(tournaments.status, status))
  if (search) conditions.push(ilike(tournaments.name, `%${search}%`))
  const whereClause = and(...conditions)
  const orderFn = sortOrder === "desc" ? desc : asc
  const orderColumn = sortBy === "name" ? tournaments.name : sortBy === "startDate" ? tournaments.startDate : tournaments.createdAt
  const [data, [{ total }]] = await Promise.all([
    db.select().from(tournaments).where(whereClause).orderBy(orderFn(orderColumn)).limit(pageSize).offset(offset),
    db.select({ total: count() }).from(tournaments).where(whereClause),
  ])
  return { data, pagination: { page, pageSize, total: Number(total), totalPages: Math.ceil(Number(total) / pageSize) } }
}

export async function openRegistration(tournamentId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const [t] = await db.update(tournaments)
    .set({ registrationOpen: true, status: "registration", updatedAt: new Date() })
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.tenantId, tenant.id)))
    .returning()
  if (!t) throw new Error("Tournament not found")
  revalidatePath(`/dashboard/tournaments/${tournamentId}`)
  return { success: true, tournament: t }
}

export async function closeRegistration(tournamentId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await requireTenant()
  const [t] = await db.update(tournaments)
    .set({ registrationOpen: false, updatedAt: new Date() })
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.tenantId, tenant.id)))
    .returning()
  if (!t) throw new Error("Tournament not found")
  revalidatePath(`/dashboard/tournaments/${tournamentId}`)
  return { success: true, tournament: t }
}
