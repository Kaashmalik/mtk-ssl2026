"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { PageTransition } from "@mtk/ui/components/ui/page-transition"
import type { UserRole } from "@/lib/rbac"

export function DashboardShell({
    children,
    userRole,
}: {
    children: React.ReactNode
    userRole: UserRole
}) {
    return (
        <div className="grid min-h-screen w-full md:grid-cols-[auto_1fr]">
            <Sidebar userRole={userRole} />
            <div className="flex flex-col min-h-screen overflow-hidden">
                <Header userRole={userRole} />
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-muted/10">
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    )
}
