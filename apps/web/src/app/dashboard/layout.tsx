import { auth } from "@clerk/nextjs/server"
import { getUserRoleAndTenantIds } from "@/lib/rbac-server"
import { DashboardShell } from "./dashboard-shell"
import type { UserRole } from "@/lib/rbac"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Resolve the user's role on the server so we can filter navigation
    let userRole: UserRole = "fan"
    try {
        const { userId } = await auth()
        if (userId) {
            const record = await getUserRoleAndTenantIds(userId)
            if (record?.role) {
                userRole = record.role
            }
        }
    } catch {
        // Fallback to 'fan' (minimal access) if role lookup fails
    }

    return <DashboardShell userRole={userRole}>{children}</DashboardShell>
}
