import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@mtk/ui/components/ui/button"
import { Card, CardContent } from "@mtk/ui/components/ui/card"
import { Badge } from "@mtk/ui/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mtk/ui/components/ui/tabs"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"
import { Plus, Clock, CheckCircle2 } from "lucide-react"

const DEMO_MATCHES = {
  live: [
    { id: "l1", teamA: "Lahore Lions", teamB: "Karachi Kings", scoreA: "165/4", scoreB: "98/3 (12.4)", venue: "Gaddafi Stadium", format: "T20", target: 166 },
  ],
  upcoming: [
    { id: "u1", teamA: "Islamabad United", teamB: "Peshawar Zalmi", date: "Today, 7:00 PM", venue: "Rawalpindi", format: "T20" },
    { id: "u2", teamA: "Multan Sultans", teamB: "Quetta Gladiators", date: "Tomorrow, 3:00 PM", venue: "Multan", format: "T20" },
    { id: "u3", teamA: "Lahore Lions", teamB: "Faisalabad Wolves", date: "May 6, 5:00 PM", venue: "Lahore", format: "T20" },
  ],
  completed: [
    { id: "c1", teamA: "Lahore Lions", scoreA: "189/5", teamB: "Islamabad United", scoreB: "156/10", result: "Lahore Lions won by 33 runs", mom: "Ahmed Khan", date: "Apr 28" },
    { id: "c2", teamA: "Peshawar Zalmi", scoreA: "145/3", teamB: "Lahore Lions", scoreB: "142/9", result: "Peshawar Zalmi won by 7 wkts", mom: "Wahab Riaz", date: "Apr 25" },
    { id: "c3", teamA: "Karachi Kings", scoreA: "168/7", teamB: "Multan Sultans", scoreB: "170/4", result: "Multan Sultans won by 6 wkts", mom: "Shan Masood", date: "Apr 22" },
  ],
}

export default async function MatchesPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <MotionWrapper variant="fadeInLeft">
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground mt-1">Schedule, score, and review cricket matches.</p>
        </MotionWrapper>
        <MotionWrapper variant="fadeInRight">
          <Link href="/dashboard/matches/new">
            <Button variant="gradient-shine" size="lg"><Plus className="mr-2 h-4 w-4" />Schedule Match</Button>
          </Link>
        </MotionWrapper>
      </div>

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live" className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-live" /></span>
            Live ({DEMO_MATCHES.live.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming"><Clock className="h-3.5 w-3.5 mr-1" />Upcoming ({DEMO_MATCHES.upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed"><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Completed ({DEMO_MATCHES.completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          {DEMO_MATCHES.live.map((m) => (
            <MotionWrapper key={m.id} variant="fadeInUp">
              <Link href={`/dashboard/matches/${m.id}`}>
                <Card className="border-live/20 bg-gradient-to-r from-live/5 via-transparent to-live/5 hover:shadow-lg transition-all cursor-pointer overflow-hidden">
                  <div className="h-0.5 bg-gradient-to-r from-live via-live/60 to-transparent" />
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-live" /></span>
                      <span className="text-xs font-semibold text-live uppercase">Live</span>
                      <Badge variant="outline" className="text-xs ml-auto">{m.format}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between"><span className="font-semibold">{m.teamA}</span><span className="font-bold text-lg tabular-nums">{m.scoreA}</span></div>
                      <div className="flex items-center justify-between"><span className="font-semibold">{m.teamB}</span><span className="font-bold text-lg tabular-nums">{m.scoreB}</span></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{m.teamB} need {m.target - parseInt(m.scoreB ?? "0")} more runs · {m.venue}</p>
                  </CardContent>
                </Card>
              </Link>
            </MotionWrapper>
          ))}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-3">
          {DEMO_MATCHES.upcoming.map((m, i) => (
            <MotionWrapper key={m.id} variant="fadeInUp" delay={0.05 * i}>
              <Link href={`/dashboard/matches/${m.id}`}>
                <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{m.teamA} vs {m.teamB}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.date} · {m.venue}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{m.format}</Badge>
                  </CardContent>
                </Card>
              </Link>
            </MotionWrapper>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3">
          {DEMO_MATCHES.completed.map((m, i) => (
            <MotionWrapper key={m.id} variant="fadeInUp" delay={0.05 * i}>
              <Link href={`/dashboard/matches/${m.id}`}>
                <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-8">
                          <span className="font-semibold text-sm">{m.teamA}</span>
                          <span className="font-bold tabular-nums text-sm">{m.scoreA}</span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <span className="font-semibold text-sm">{m.teamB}</span>
                          <span className="font-bold tabular-nums text-sm">{m.scoreB}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs text-muted-foreground">{m.date}</Badge>
                    </div>
                    <p className="text-xs text-success font-medium">{m.result}</p>
                    <p className="text-xs text-muted-foreground">MoM: {m.mom}</p>
                  </CardContent>
                </Card>
              </Link>
            </MotionWrapper>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
