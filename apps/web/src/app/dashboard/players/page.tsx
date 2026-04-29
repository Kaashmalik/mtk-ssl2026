import { Button } from "@mtk/ui/components/ui/button"
import { Plus, User } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@mtk/ui/components/ui/empty-state"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"

export default function PlayersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <MotionWrapper variant="fadeInLeft">
                    <h1 className="text-3xl font-bold tracking-tight">Players</h1>
                    <p className="text-muted-foreground">Register players and manage profiles.</p>
                </MotionWrapper>
                <MotionWrapper variant="fadeInRight">
                    <Link href="/dashboard/players/new">
                        <Button variant="gradient-shine">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Player
                        </Button>
                    </Link>
                </MotionWrapper>
            </div>

            <MotionWrapper variant="fadeInUp" delay={0.2} className="min-h-[400px] flex items-center justify-center rounded-xl border border-dashed bg-muted/20">
                <EmptyState
                    title="No players registered"
                    description="Start adding players to your league database."
                    icon={<User className="h-10 w-10" />}
                />
            </MotionWrapper>
        </div>
    )
}
