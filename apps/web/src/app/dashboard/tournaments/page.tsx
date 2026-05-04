import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@mtk/ui/components/ui/button"
import { Card, CardContent } from "@mtk/ui/components/ui/card"
import { Badge } from "@mtk/ui/components/ui/badge"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"
import { Plus, Trophy, Calendar, Users, Swords } from "lucide-react"

const DEMO_TOURNAMENTS = [
  { id: "1", name: "SSL Premier League 2026", format: "league", status: "live", startDate: "2026-04-01", endDate: "2026-06-30", maxTeams: 8, registeredTeams: 8, matchesPlayed: 24, totalMatches: 56 },
  { id: "2", name: "SSL T10 Blast", format: "knockout", status: "registration", startDate: "2026-07-15", endDate: "2026-07-25", maxTeams: 16, registeredTeams: 10, matchesPlayed: 0, totalMatches: 15 },
  { id: "3", name: "SSL Champions Trophy", format: "hybrid", status: "draft", startDate: "2026-09-01", endDate: "2026-10-15", maxTeams: 12, registeredTeams: 0, matchesPlayed: 0, totalMatches: 0 },
  { id: "4", name: "SSL Super League 2025", format: "round_robin", status: "completed", startDate: "2025-09-01", endDate: "2025-11-30", maxTeams: 6, registeredTeams: 6, matchesPlayed: 30, totalMatches: 30 },
]

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  draft: { label: "Draft", class: "bg-muted text-muted-foreground" },
  registration: { label: "Registration Open", class: "bg-info/10 text-info border-info/20" },
  live: { label: "Live", class: "bg-live/10 text-live border-live/20" },
  completed: { label: "Completed", class: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "Cancelled", class: "bg-destructive/10 text-destructive border-destructive/20" },
}

const FORMAT_LABELS: Record<string, string> = {
  knockout: "Knockout", league: "League", hybrid: "Group + KO", round_robin: "Round Robin",
}

export default async function TournamentsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <MotionWrapper variant="fadeInLeft">
          <h1 className="text-3xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-muted-foreground mt-1">Manage leagues and tournament brackets.</p>
        </MotionWrapper>
        <MotionWrapper variant="fadeInRight">
          <Link href="/dashboard/tournaments/new">
            <Button variant="gradient-shine" size="lg"><Plus className="mr-2 h-4 w-4" />Create Tournament</Button>
          </Link>
        </MotionWrapper>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DEMO_TOURNAMENTS.map((t, i) => {
          const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.draft
          const progress = t.totalMatches > 0 ? Math.round((t.matchesPlayed / t.totalMatches) * 100) : 0
          return (
            <MotionWrapper key={t.id} variant="fadeInUp" delay={0.05 * i}>
              <Link href={`/dashboard/tournaments/${t.id}`}>
                <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer group h-full">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Trophy className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base group-hover:text-primary transition-colors">{t.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className={`text-xs ${cfg.class}`}>{cfg.label}</Badge>
                            <Badge variant="outline" className="text-xs">{FORMAT_LABELS[t.format]}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{t.registeredTeams}/{t.maxTeams} teams</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Swords className="h-3.5 w-3.5" />
                        <span>{t.matchesPlayed} matches</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(t.startDate).toLocaleDateString("en-PK", { month: "short", year: "numeric" })}</span>
                      </div>
                    </div>

                    {/* Progress bar for live/completed */}
                    {t.totalMatches > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </MotionWrapper>
          )
        })}
      </div>
    </div>
  )
}
