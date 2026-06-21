"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { db } from "@mtk/database"
import { tenants, tenantBranding } from "@mtk/database"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { withAuth } from "./action-guard"


const createTenantSchema = z.object({
  name: z.string().min(2, "League name must be at least 2 characters").max(120),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(60, "Slug must be 60 characters or fewer")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function getMyTenant() {
  const { userId } = await auth()
  if (!userId) return null

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.ownerId, userId))
    .limit(1)

  return tenant ?? null
}

export async function createTenant(input: CreateTenantInput) {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const existing = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.ownerId, userId))
    .limit(1)

  if (existing.length > 0) {
    throw new Error("You already have a league. Contact support to create another.")
  }

  const parsed = createTenantSchema.parse({
    ...input,
    slug: input.slug ? input.slug : generateSlug(input.name),
  })

  const [slugTaken] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, parsed.slug))
    .limit(1)

  if (slugTaken) {
    throw new Error("This league URL is already taken. Please choose another.")
  }

  const [tenant] = await db
    .insert(tenants)
    .values({
      name: parsed.name,
      slug: parsed.slug,
      customDomain: null,
      ownerId: userId,
      isActive: true,
    })
    .returning()

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/league")

  return { success: true, tenant }
}

const updateBrandingSchema = z.object({
  name: z.string().min(2, "League name must be at least 2 characters").max(120),
  appName: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  faviconUrl: z.string().url().optional().nullable().or(z.literal("")),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional().nullable(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional().nullable(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color").optional().nullable(),
})

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>

export const updateTenantBrandingSettings = withAuth("settings:manage", async (input: UpdateBrandingInput) => {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  const tenant = await getMyTenant()
  if (!tenant) throw new Error("Tenant not found")

  const validated = updateBrandingSchema.parse(input)

  // Update tenant name
  await db.update(tenants)
    .set({ name: validated.name, updatedAt: new Date() })
    .where(eq(tenants.id, tenant.id))

  // Upsert tenant branding
  const brandingData = {
    tenantId: tenant.id,
    appName: validated.appName || validated.name,
    logoUrl: validated.logoUrl || null,
    faviconUrl: validated.faviconUrl || null,
    primaryColor: validated.primaryColor || null,
    secondaryColor: validated.secondaryColor || null,
    accentColor: validated.accentColor || null,
    updatedAt: new Date()
  }

  const [existingBranding] = await db.select().from(tenantBranding).where(eq(tenantBranding.tenantId, tenant.id)).limit(1)
  if (existingBranding) {
    await db.update(tenantBranding).set(brandingData).where(eq(tenantBranding.tenantId, tenant.id))
  } else {
    await db.insert(tenantBranding).values({
      ...brandingData,
      createdAt: new Date()
    })
  }

  revalidatePath("/dashboard/settings")
  revalidatePath("/dashboard")
  return { success: true }
})
