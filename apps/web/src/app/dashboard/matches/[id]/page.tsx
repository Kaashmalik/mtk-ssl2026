import Link from "next/link"
import { Button } from "@mtk/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@mtk/ui/components/ui/card"
import { Badge } from "@mtk/ui/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@mtk/ui/components/ui/tabs"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"
import { ArrowLeft, Trophy } from "lucide-react"

const MATCH = {
  id: "c1", status: "completed", format: "T20", totalOvers: 20,
  teamA: { name: "Lahore Lions", shortName: "LL", color: "#2D8B4E" },
  teamB: { name: "Islamabad United", shortName: "IU", color: "#E74C3C" },
  toss: "Lahore Lions won toss and elected to bat",
  result: "Lahore Lions won by 33 runs",
  mom: "Ahmed Khan (112* off 68)",
  venue: "Gaddafi Stadium, Lahore", date: "April 28, 2026",
  innings: [
    {
      team: "Lahore Lions", score: "189/5", overs: "20.0",
      batting: [
        { name: "Ahmed Khan", dismissal: "not out", runs: 112, balls: 68, fours: 12, sixes: 6, sr: "164.71" },
        { name: "Bilal Ahmed", dismissal: "c Shadab b Hasan", runs: 34, balls: 28, fours: 4, sixes: 1, sr: "121.43" },
        { name: "Usman Ali", dismissal: "b Faheem", runs: 22, balls: 16, fours: 2, sixes: 1, sr: "137.50" },
        { name: "Junaid Shah", dismissal: "lbw b Shadab", runs: 8, balls: 10, fours: 1, sixes: 0, sr: "80.00" },
        { name: "Shahid Ali", dismissal: "run out (Saad)", runs: 5, balls: 4, fours: 0, sixes: 1, sr: "125.00" },
        { name: "Tariq Mehmood", dismissal: "not out", runs: 3, balls: 2, fours: 0, sixes: 0, sr: "150.00" },
      ],
      bowling: [
        { name: "Hasan Ali", overs: "4.0", maidens: 0, runs: 38, wickets: 1, economy: "9.50" },
        { name: "Faheem Ashraf", overs: "4.0", maidens: 0, runs: 42, wickets: 1, economy: "10.50" },
        { name: "Shadab Khan", overs: "4.0", maidens: 0, runs: 32, wickets: 1, economy: "8.00" },
        { name: "Asif Ali", overs: "4.0", maidens: 0, runs: 44, wickets: 1, economy: "11.00" },
        { name: "Rumman Raees", overs: "4.0", maidens: 0, runs: 28, wickets: 1, economy: "7.00" },
      ],
      extras: "5 (2w, 2nb, 1lb)",
    },
    {
      team: "Islamabad United", score: "156/10", overs: "18.4",
      batting: [
        { name: "Saad Baig", dismissal: "c Ahmed b Tariq", runs: 45, balls: 32, fours: 5, sixes: 2, sr: "140.63" },
        { name: "Shadab Khan", dismissal: "b Shahid", runs: 38, balls: 30, fours: 3, sixes: 2, sr: "126.67" },
        { name: "Asif Ali", dismissal: "c Bilal b Usman", runs: 28, balls: 18, fours: 2, sixes: 2, sr: "155.56" },
        { name: "Hasan Ali", dismissal: "lbw b Shahid", runs: 15, balls: 12, fours: 1, sixes: 1, sr: "125.00" },
        { name: "Faheem Ashraf", dismissal: "c&b Usman", runs: 12, balls: 10, fours: 1, sixes: 0, sr: "120.00" },
      ],
      bowling: [
        { name: "Tariq Mehmood", overs: "4.0", maidens: 1, runs: 28, wickets: 2, economy: "7.00" },
        { name: "Shahid Ali", overs: "4.0", maidens: 0, runs: 32, wickets: 3, economy: "8.00" },
        { name: "Usman Ali", overs: "3.4", maidens: 0, runs: 36, wickets: 2, economy: "9.82" },
        { name: "Bilal Ahmed", overs: "4.0", maidens: 0, runs: 30, wickets: 2, economy: "7.50" },
        { name: "Junaid Shah", overs: "3.0", maidens: 0, runs: 25, wickets: 1, economy: "8.33" },
      ],
      extras: "3 (1w, 2lb)",
    },
  ],
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _id } = await params
  const match = MATCH

  return (
    <div className="space-y-6">
      <MotionWrapper variant="fadeInLeft">
        <Link href="/dashboard/matches"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
      </MotionWrapper>

      {/* Match Header Hero */}
      <MotionWrapper variant="fadeInUp" delay={0.1}>
        <Card className="overflow-hidden border-none shadow-xl relative text-white">
          <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(135deg, ${match.teamA.color}, ${match.teamB.color})`, opacity: 0.85 }} />
          <div className="absolute inset-0 z-0 bg-black/20 backdrop-blur-md" />
          <CardContent className="pt-8 pb-6 relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Badge variant="outline" className="text-xs border-white/30 text-white bg-white/10 backdrop-blur-sm">{match.format} · {match.venue}</Badge>
              <Badge variant="outline" className="text-xs border-white/30 text-white bg-white/10 backdrop-blur-sm">{match.date}</Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="text-center flex-1">
                <div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-xl mb-3 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-2 border-white/20" style={{ backgroundColor: match.teamA.color }}>{match.teamA.shortName}</div>
                <p className="font-bold text-base text-white">{match.teamA.name}</p>
                <p className="text-3xl font-bold tabular-nums mt-1 text-white">{match.innings[0].score}</p>
                <p className="text-sm text-white/70 font-medium">({match.innings[0].overs} ov)</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs text-white/50 font-bold tracking-widest uppercase">VS</p>
              </div>
              <div className="text-center flex-1">
                <div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-xl mb-3 shadow-[0_0_20px_rgba(0,0,0,0.3)] border-2 border-white/20" style={{ backgroundColor: match.teamB.color }}>{match.teamB.shortName}</div>
                <p className="font-bold text-base text-white">{match.teamB.name}</p>
                <p className="text-3xl font-bold tabular-nums mt-1 text-white">{match.innings[1].score}</p>
                <p className="text-sm text-white/70 font-medium">({match.innings[1].overs} ov)</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20 text-center">
              <p className="text-base font-bold text-white tracking-wide">{match.result}</p>
              <p className="text-sm text-white/80 mt-1 font-medium">{match.toss}</p>
              <p className="text-sm mt-2 flex items-center justify-center gap-1.5"><Trophy className="h-4 w-4 text-yellow-400 drop-shadow-md" /> <span className="text-white/80">Player of the Match:</span> <span className="font-bold text-white">{match.mom}</span></p>
            </div>
          </CardContent>
        </Card>
      </MotionWrapper>

      {/* Scorecards */}
      <MotionWrapper variant="fadeInUp" delay={0.2}>
        <Tabs defaultValue="innings1" className="space-y-4">
          <TabsList>
            <TabsTrigger value="innings1">{match.teamA.name} Innings</TabsTrigger>
            <TabsTrigger value="innings2">{match.teamB.name} Innings</TabsTrigger>
          </TabsList>

          {match.innings.map((inn, idx) => (
            <TabsContent key={idx} value={`innings${idx + 1}`} className="space-y-4">
              {/* Batting */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Batting — {inn.team} ({inn.score})</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-muted-foreground text-xs">
                        <th className="py-2 text-left font-medium">Batter</th>
                        <th className="py-2 text-left font-medium">Dismissal</th>
                        <th className="py-2 text-center font-medium">R</th>
                        <th className="py-2 text-center font-medium">B</th>
                        <th className="py-2 text-center font-medium">4s</th>
                        <th className="py-2 text-center font-medium">6s</th>
                        <th className="py-2 text-center font-medium">SR</th>
                      </tr></thead>
                      <tbody>
                        {inn.batting.map((b, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="py-2 font-medium">{b.name}</td>
                            <td className="py-2 text-muted-foreground text-xs">{b.dismissal}</td>
                            <td className="py-2 text-center tabular-nums font-semibold">{b.runs}</td>
                            <td className="py-2 text-center tabular-nums">{b.balls}</td>
                            <td className="py-2 text-center tabular-nums">{b.fours}</td>
                            <td className="py-2 text-center tabular-nums">{b.sixes}</td>
                            <td className="py-2 text-center tabular-nums">{b.sr}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Extras: {inn.extras}</p>
                </CardContent>
              </Card>

              {/* Bowling */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Bowling</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-muted-foreground text-xs">
                        <th className="py-2 text-left font-medium">Bowler</th>
                        <th className="py-2 text-center font-medium">O</th>
                        <th className="py-2 text-center font-medium">M</th>
                        <th className="py-2 text-center font-medium">R</th>
                        <th className="py-2 text-center font-medium">W</th>
                        <th className="py-2 text-center font-medium">Econ</th>
                      </tr></thead>
                      <tbody>
                        {inn.bowling.map((b, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="py-2 font-medium">{b.name}</td>
                            <td className="py-2 text-center tabular-nums">{b.overs}</td>
                            <td className="py-2 text-center tabular-nums">{b.maidens}</td>
                            <td className="py-2 text-center tabular-nums">{b.runs}</td>
                            <td className="py-2 text-center tabular-nums font-semibold">{b.wickets}</td>
                            <td className="py-2 text-center tabular-nums">{b.economy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </MotionWrapper>
    </div>
  )
}
