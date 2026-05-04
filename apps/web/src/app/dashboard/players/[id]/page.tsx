import Link from "next/link"
import { Button } from "@mtk/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@mtk/ui/components/ui/card"
import { Badge } from "@mtk/ui/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mtk/ui/components/ui/tabs"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"
import { ArrowLeft, Edit, Heart, Trophy, Target, Crosshair, Shield } from "lucide-react"

// Demo player data
const PLAYER = {
  id: "1", name: "Ahmed Khan", role: "batsman", battingStyle: "right", bowlingStyle: null,
  teamName: "Lahore Lions", jerseyNumber: 7, status: "active", city: "Lahore", nationality: "Pakistani",
  dateOfBirth: "1998-05-15", heightCm: 178, weightKg: 74,
  biography: "Top-order batsman known for aggressive stroke play. Has been consistent performer across multiple SSL seasons.",
  career: { matchesPlayed: 48, runsScored: 1842, ballsFaced: 1456, fours: 198, sixes: 72, fifties: 14, hundreds: 5, highestScore: 112, wicketsTaken: 3, catches: 22 },
  seasons: [
    { name: "SSL Premier 2026", matches: 12, runs: 486, avg: "44.18", sr: "138.46", hs: "112*", wickets: 1 },
    { name: "SSL Premier 2025", matches: 14, runs: 542, avg: "41.69", sr: "132.20", hs: "98", wickets: 2 },
    { name: "SSL Super 2025", matches: 10, runs: 380, avg: "38.00", sr: "126.67", hs: "87*", wickets: 0 },
    { name: "SSL Premier 2024", matches: 12, runs: 434, avg: "39.45", sr: "129.76", hs: "104*", wickets: 0 },
  ],
  recentMatches: [
    { vs: "Karachi Kings", score: "78(52)", result: "Won", date: "Apr 28" },
    { vs: "Peshawar Zalmi", score: "45(32)", result: "Lost", date: "Apr 25" },
    { vs: "Islamabad United", score: "112*(68)", result: "Won", date: "Apr 22" },
    { vs: "Multan Sultans", score: "23(18)", result: "Won", date: "Apr 19" },
  ],
}

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = PLAYER
  const battingAvg = (player.career.runsScored / Math.max(player.career.matchesPlayed, 1)).toFixed(2)
  const strikeRate = ((player.career.runsScored / Math.max(player.career.ballsFaced, 1)) * 100).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Header */}
      <MotionWrapper variant="fadeInLeft">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/players"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
        </div>
      </MotionWrapper>

      {/* Profile Hero */}
      <MotionWrapper variant="fadeInUp" delay={0.1}>
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <CardContent className="-mt-12 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="h-20 w-20 rounded-2xl bg-primary/10 border-4 border-card flex items-center justify-center text-primary font-bold text-2xl shadow-lg">
                {player.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{player.name}</h1>
                  <Badge variant="outline" className="text-xs">#{player.jerseyNumber}</Badge>
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20 capitalize">{player.status}</Badge>
                </div>
                <p className="text-muted-foreground text-sm mt-1">{player.teamName} · {player.city}, {player.nationality}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Heart className="h-4 w-4 mr-1" />Follow</Button>
                <Link href={`/dashboard/players/${id}/edit`}><Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1" />Edit</Button></Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </MotionWrapper>

      {/* Career Stats Cards */}
      <MotionWrapper variant="fadeInUp" delay={0.2}>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Matches", value: player.career.matchesPlayed, icon: Shield },
            { label: "Runs", value: player.career.runsScored.toLocaleString(), icon: Target },
            { label: "Average", value: battingAvg, icon: Trophy },
            { label: "Strike Rate", value: strikeRate, icon: Crosshair },
            { label: "50s / 100s", value: `${player.career.fifties} / ${player.career.hundreds}` },
            { label: "Highest", value: player.career.highestScore },
          ].map((stat, i) => (
            <Card key={i} className="text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </MotionWrapper>

      {/* Tabbed Content */}
      <MotionWrapper variant="fadeInUp" delay={0.3}>
        <Tabs defaultValue="seasons" className="space-y-4">
          <TabsList>
            <TabsTrigger value="seasons">Season Stats</TabsTrigger>
            <TabsTrigger value="matches">Recent Matches</TabsTrigger>
            <TabsTrigger value="info">Profile Info</TabsTrigger>
          </TabsList>

          <TabsContent value="seasons">
            <Card>
              <CardHeader><CardTitle className="text-lg">Season-by-Season Performance</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground">
                      <th className="py-2 text-left font-medium">Season</th>
                      <th className="py-2 text-center font-medium">M</th>
                      <th className="py-2 text-center font-medium">Runs</th>
                      <th className="py-2 text-center font-medium">Avg</th>
                      <th className="py-2 text-center font-medium">SR</th>
                      <th className="py-2 text-center font-medium">HS</th>
                      <th className="py-2 text-center font-medium">Wkts</th>
                    </tr></thead>
                    <tbody>
                      {player.seasons.map((s, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                          <td className="py-2.5 font-medium">{s.name}</td>
                          <td className="py-2.5 text-center tabular-nums">{s.matches}</td>
                          <td className="py-2.5 text-center tabular-nums font-semibold">{s.runs}</td>
                          <td className="py-2.5 text-center tabular-nums">{s.avg}</td>
                          <td className="py-2.5 text-center tabular-nums">{s.sr}</td>
                          <td className="py-2.5 text-center tabular-nums">{s.hs}</td>
                          <td className="py-2.5 text-center tabular-nums">{s.wickets}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches">
            <Card>
              <CardHeader><CardTitle className="text-lg">Recent Performances</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {player.recentMatches.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-semibold text-sm">vs {m.vs}</p>
                      <p className="text-xs text-muted-foreground">{m.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold tabular-nums">{m.score}</p>
                      <Badge variant="outline" className={`text-xs ${m.result === "Won" ? "text-success border-success/20" : "text-destructive border-destructive/20"}`}>
                        {m.result}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardHeader><CardTitle className="text-lg">Player Information</CardTitle></CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ["Role", player.role?.replace("_", " ")],
                    ["Batting Style", player.battingStyle === "right" ? "Right-Hand" : "Left-Hand"],
                    ["Date of Birth", player.dateOfBirth],
                    ["Height", `${player.heightCm} cm`],
                    ["Weight", `${player.weightKg} kg`],
                    ["City", player.city],
                    ["Nationality", player.nationality],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="font-medium text-sm capitalize">{value ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
                {player.biography && <p className="mt-4 text-sm text-muted-foreground border-t pt-4">{player.biography}</p>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </MotionWrapper>
    </div>
  )
}
