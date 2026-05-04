import Link from "next/link"
import { Button } from "@mtk/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@mtk/ui/components/ui/card"
import { Badge } from "@mtk/ui/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mtk/ui/components/ui/tabs"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"
import { ArrowLeft, Edit, Heart, MapPin } from "lucide-react"

const TEAM = {
  id: "1", name: "Lahore Lions", shortName: "LL", city: "Lahore", primaryColor: "#2D8B4E", secondaryColor: "#1A8040",
  homeGround: "Gaddafi Stadium", foundedYear: 2023, description: "One of the most popular teams in SSL.",
  record: { played: 12, wins: 8, losses: 3, draws: 1 },
  players: [
    { id: "1", name: "Ahmed Khan", role: "batsman", jerseyNumber: 7, isCaptain: true },
    { id: "2", name: "Bilal Ahmed", role: "bowler", jerseyNumber: 44, isCaptain: false },
    { id: "3", name: "Usman Ali", role: "all_rounder", jerseyNumber: 18, isCaptain: false },
    { id: "4", name: "Faisal Iqbal", role: "wicket_keeper", jerseyNumber: 1, isCaptain: false },
    { id: "5", name: "Junaid Shah", role: "batsman", jerseyNumber: 55, isCaptain: false },
    { id: "6", name: "Tariq Mehmood", role: "bowler", jerseyNumber: 32, isCaptain: false },
    { id: "7", name: "Shahid Ali", role: "all_rounder", jerseyNumber: 8, isCaptain: false },
  ],
  recentMatches: [
    { vs: "Karachi Kings", score: "165/4", opScore: "158/8", result: "Won by 7 runs", date: "Apr 28" },
    { vs: "Peshawar Zalmi", score: "142/9", opScore: "145/3", result: "Lost by 7 wkts", date: "Apr 25" },
    { vs: "Islamabad United", score: "189/5", opScore: "156/10", result: "Won by 33 runs", date: "Apr 22" },
  ],
}

const ROLE_LABELS: Record<string, string> = { batsman: "BAT", bowler: "BOWL", all_rounder: "AR", wicket_keeper: "WK" }

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const team = TEAM
  const winRate = ((team.record.wins / Math.max(team.record.played, 1)) * 100).toFixed(0)

  return (
    <div className="space-y-6">
      <MotionWrapper variant="fadeInLeft">
        <Link href="/dashboard/teams"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
      </MotionWrapper>

      {/* Hero */}
      <MotionWrapper variant="fadeInUp" delay={0.1}>
        <Card className="overflow-hidden border-none shadow-xl relative text-white">
          <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`, opacity: 0.85 }} />
          <div className="absolute inset-0 z-0 bg-black/20 backdrop-blur-md" />
          <CardContent className="pt-8 pb-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="h-24 w-24 rounded-2xl flex items-center justify-center text-white font-bold text-3xl border-2 border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.3)] shrink-0" style={{ backgroundColor: team.primaryColor }}>
                {team.shortName}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight text-white">{team.name}</h1>
                <div className="flex items-center gap-3 text-sm text-white/70 font-medium mt-2">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-white/50" />{team.city}</span>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span>{team.homeGround}</span>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span>Est. {team.foundedYear}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/30 hover:bg-white/20"><Heart className="h-4 w-4 mr-1" />Follow</Button>
                <Link href={`/dashboard/teams/${id}/edit`}><Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" />Edit</Button></Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionWrapper>

      {/* Stats */}
      <MotionWrapper variant="fadeInUp" delay={0.2}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="text-center"><CardContent className="pt-4 pb-3"><p className="text-2xl font-bold">{team.record.played}</p><p className="text-xs text-muted-foreground">Played</p></CardContent></Card>
          <Card className="text-center"><CardContent className="pt-4 pb-3"><p className="text-2xl font-bold text-success">{team.record.wins}</p><p className="text-xs text-muted-foreground">Won</p></CardContent></Card>
          <Card className="text-center"><CardContent className="pt-4 pb-3"><p className="text-2xl font-bold text-destructive">{team.record.losses}</p><p className="text-xs text-muted-foreground">Lost</p></CardContent></Card>
          <Card className="text-center"><CardContent className="pt-4 pb-3"><p className="text-2xl font-bold">{winRate}%</p><p className="text-xs text-muted-foreground">Win Rate</p></CardContent></Card>
        </div>
      </MotionWrapper>

      {/* Tabs */}
      <MotionWrapper variant="fadeInUp" delay={0.3}>
        <Tabs defaultValue="squad" className="space-y-4">
          <TabsList>
            <TabsTrigger value="squad">Squad ({team.players.length})</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
          </TabsList>

          <TabsContent value="squad">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {team.players.map((p) => (
                <Link key={p.id} href={`/dashboard/players/${p.id}`}>
                  <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {p.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm truncate">{p.name}</p>
                            {p.isCaptain && <Badge className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-primary/20" variant="outline">C</Badge>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>#{p.jerseyNumber}</span>
                            <Badge variant="outline" className="text-[10px] h-4 px-1">{ROLE_LABELS[p.role] ?? p.role}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="matches">
            <Card>
              <CardHeader><CardTitle className="text-lg">Recent Results</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {team.recentMatches.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                    <div>
                      <p className="font-semibold text-sm">vs {m.vs}</p>
                      <p className="text-xs text-muted-foreground">{m.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm tabular-nums">{m.score} — {m.opScore}</p>
                      <Badge variant="outline" className={`text-xs ${m.result.startsWith("Won") ? "text-success border-success/20" : "text-destructive border-destructive/20"}`}>
                        {m.result}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </MotionWrapper>
    </div>
  )
}
