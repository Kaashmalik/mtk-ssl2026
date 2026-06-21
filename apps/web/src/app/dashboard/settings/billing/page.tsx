import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"
import { getMyTenant } from "@/app/actions/tenants"
import { BillingPageClient } from "./billing-client"
import { unstable_noStore as noStore } from "next/cache"

export const metadata = {
  title: "Billing & Plan",
}

export default async function BillingPage() {
  noStore()

  const { userId } = await auth()
  if (!userId) redirect("/")

  const tenant = await getMyTenant()
  if (!tenant) redirect("/dashboard/league/setup")

  return (
    <div className="space-y-6">
      {/* Header */}
      <MotionWrapper variant="fadeInLeft">
        <h1 className="text-3xl font-bold tracking-tight">Billing & Plan</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription plan, view payment history, and upgrade your league.
        </p>
      </MotionWrapper>

      {/* Billing Content */}
      <MotionWrapper variant="fadeInUp" delay={0.1}>
        <BillingPageClient tenant={tenant} clerkUserId={userId} />
      </MotionWrapper>
    </div>
  )
}
