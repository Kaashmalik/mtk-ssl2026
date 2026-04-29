import { Button } from "@mtk/ui/components/ui/button"
import { Plus, Shield } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@mtk/ui/components/ui/empty-state"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"

export default function TeamsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <MotionWrapper variant="fadeInLeft">
                    <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
                    <p className="text-muted-foreground">Manage your cricket teams and squads.</p>
                </MotionWrapper>
                <MotionWrapper variant="fadeInRight">
                    <Link href="/dashboard/teams/new">
                        <Button variant="gradient-shine">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Team
                        </Button>
                    </Link>
                </MotionWrapper>
            </div>

            <MotionWrapper variant="fadeInUp" delay={0.2} className="min-h-[400px] flex items-center justify-center rounded-xl border border-dashed bg-muted/20">
                <EmptyState
                    title="No teams found"
                    description="You haven't added any teams yet. Create your first team to get started."
                    icon={<Shield className="h-10 w-10" />}
                    action={{
                        label: "Create Team",
                        onClick: () => { }, // In a real app this would route or open modal, the Link above handles navigation
                    }}
                />
            </MotionWrapper>
        </div>
    )
}
