import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@mtk/ui/components/ui/button"
import { Card, CardContent } from "@mtk/ui/components/ui/card"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"
import { Plus, MapPin } from "lucide-react"

const DEMO_TEAMS = [
  { id: "1", name: "Lahore Lions", shortName: "LL", city: "Lahore", primaryColor: "#2D8B4E", playerCount: 15, wins: 8, losses: 3, draws: 1 },
  { id: "2", name: "Karachi Kings", shortName: "KK", city: "Karachi", primaryColor: "#1A4F8B", playerCount: 14, wins: 7, losses: 4, draws: 1 },
  { id: "3", name: "Islamabad United", shortName: "IU", city: "Islamabad", primaryColor: "#E74C3C", playerCount: 13, wins: 6, losses: 5, draws: 1 },
  { id: "4", name: "Peshawar Zalmi", shortName: "PZ", city: "Peshawar", primaryColor: "#F1C40F", playerCount: 15, wins: 5, losses: 6, draws: 1 },
  { id: "5", name: "Multan Sultans", shortName: "MS", city: "Multan", primaryColor: "#27AE60", playerCount: 12, wins: 4, losses: 7, draws: 1 },
  { id: "6", name: "Quetta Gladiators", shortName: "QG", city: "Quetta", primaryColor: "#8E44AD", playerCount: 14, wins: 3, losses: 8, draws: 1 },
]

export default async function TeamsPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <MotionWrapper variant="fadeInLeft">
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground mt-1">Manage your cricket teams and squads.</p>
        </MotionWrapper>
        <MotionWrapper variant="fadeInRight">
          <Link href="/dashboard/teams/new">
            <Button variant="gradient-shine" size="lg"><Plus className="mr-2 h-4 w-4" />Add Team</Button>
          </Link>
        </MotionWrapper>
      </div>

      {/* Team Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_TEAMS.map((team, i) => (
          <MotionWrapper key={team.id} variant="fadeInUp" delay={0.05 * i}>
            <Link href={`/dashboard/teams/${team.id}`}>
              <Card className="hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden bg-card/80 backdrop-blur-sm border-border/50">
                {/* Color Bar */}
                <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${team.primaryColor}, ${team.primaryColor}88)` }} />
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-md" style={{ backgroundColor: team.primaryColor }}>
                        {team.shortName}
                      </div>
                      <div>
                        <h3 className="font-bold text-base group-hover:text-primary transition-colors">{team.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{team.city}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t">
                    <div className="text-center">
                      <p className="text-lg font-bold tabular-nums">{team.playerCount}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Players</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold tabular-nums text-success">{team.wins}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Wins</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold tabular-nums text-destructive">{team.losses}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Losses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </MotionWrapper>
        ))}
      </div>
    </div>
  )
}
