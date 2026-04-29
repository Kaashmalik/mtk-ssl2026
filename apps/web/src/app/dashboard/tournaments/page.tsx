import { Button } from "@mtk/ui/components/ui/button"
import { Plus, Trophy } from "lucide-react"
import Link from "next/link"
import { EmptyState } from "@mtk/ui/components/ui/empty-state"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"
import { TournamentBracket } from "@mtk/ui"

export default function TournamentsPage() {
    const hasTournaments = true // Set to true to show the demo bracket

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <MotionWrapper variant="fadeInLeft">
                    <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
                    <p className="text-muted-foreground">Manage leagues and tournament brackets.</p>
                </MotionWrapper>
                <MotionWrapper variant="fadeInRight">
                    <Link href="/dashboard/tournaments/new">
                        <Button variant="gradient-shine">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Tournament
                        </Button>
                    </Link>
                </MotionWrapper>
            </div>

            <MotionWrapper variant="fadeInUp" delay={0.2}>
                {hasTournaments ? (
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                        <h2 className="text-xl font-bold mb-6">SSL Premier League 2026 - Knockouts</h2>
                        <TournamentBracket />
                    </div>
                ) : (
                    <div className="min-h-[400px] flex items-center justify-center rounded-xl border border-dashed bg-muted/20">
                        <EmptyState
                            title="No tournaments found"
                            description="Create your first tournament to get started."
                            icon={<Trophy className="h-10 w-10" />}
                        />
                    </div>
                )}
            </MotionWrapper>
        </div>
    )
}
