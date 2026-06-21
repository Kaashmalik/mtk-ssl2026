import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"
import { getMyTenant } from "@/app/actions/tenants"
import { TenantSettingsForm } from "@/components/settings/tenant-settings-form"
import { db, tenantBranding } from "@mtk/database"
import { eq } from "drizzle-orm"
import { unstable_noStore as noStore } from "next/cache"

export default async function SettingsPage() {
  noStore()

  const { userId } = await auth()
  if (!userId) redirect("/")

  const tenant = await getMyTenant()
  if (!tenant) redirect("/dashboard/league/setup")

  const [branding] = await db.select().from(tenantBranding)
    .where(eq(tenantBranding.tenantId, tenant.id))
    .limit(1)

  const initialData = {
    name: tenant.name,
    appName: branding?.appName || null,
    logoUrl: branding?.logoUrl || null,
    faviconUrl: branding?.faviconUrl || null,
    primaryColor: branding?.primaryColor || null,
    secondaryColor: branding?.secondaryColor || null,
    accentColor: branding?.accentColor || null,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <MotionWrapper variant="fadeInLeft">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your league profile, app settings, and team branding configurations.
        </p>
      </MotionWrapper>

      {/* Form */}
      <MotionWrapper variant="fadeInUp" delay={0.1}>
        <TenantSettingsForm initialData={initialData} />
      </MotionWrapper>
    </div>
  )
}
