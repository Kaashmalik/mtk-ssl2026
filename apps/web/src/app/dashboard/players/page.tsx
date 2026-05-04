import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@mtk/ui/components/ui/button"
import { Badge } from "@mtk/ui/components/ui/badge"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"
import { Plus } from "lucide-react"

// Demo data for showcase — replace with getPlayers() when DB is connected
const DEMO_PLAYERS = [
  { id: "1", name: "Ahmed Khan", role: "batsman", battingStyle: "right", teamName: "Lahore Lions", jerseyNumber: 7, status: "active", photoUrl: null, city: "Lahore" },
  { id: "2", name: "Bilal Ahmed", role: "bowler", battingStyle: "right", teamName: "Karachi Kings", jerseyNumber: 44, status: "active", photoUrl: null, city: "Karachi" },
  { id: "3", name: "Usman Ali", role: "all_rounder", battingStyle: "left", teamName: "Islamabad United", jerseyNumber: 18, status: "active", photoUrl: null, city: "Islamabad" },
  { id: "4", name: "Faisal Iqbal", role: "wicket_keeper", battingStyle: "right", teamName: "Peshawar Zalmi", jerseyNumber: 1, status: "injured", photoUrl: null, city: "Peshawar" },
  { id: "5", name: "Hassan Raza", role: "bowler", battingStyle: "left", teamName: "Multan Sultans", jerseyNumber: 99, status: "active", photoUrl: null, city: "Multan" },
  { id: "6", name: "Imran Malik", role: "batsman", battingStyle: "right", teamName: "Quetta Gladiators", jerseyNumber: 10, status: "active", photoUrl: null, city: "Quetta" },
  { id: "7", name: "Junaid Shah", role: "all_rounder", battingStyle: "right", teamName: "Lahore Lions", jerseyNumber: 55, status: "suspended", photoUrl: null, city: "Lahore" },
  { id: "8", name: "Kamran Yousuf", role: "batsman", battingStyle: "left", teamName: "Karachi Kings", jerseyNumber: 23, status: "active", photoUrl: null, city: "Karachi" },
]

const ROLE_LABELS: Record<string, string> = {
  batsman: "Batsman",
  bowler: "Bowler",
  all_rounder: "All-Rounder",
  wicket_keeper: "Wicket Keeper",
  wicket_keeper_batsman: "WK-Batsman",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  injured: "bg-warning/10 text-warning border-warning/20",
  retired: "bg-muted text-muted-foreground border-border",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
  inactive: "bg-muted text-muted-foreground border-border",
}

const ROLE_COLORS: Record<string, string> = {
  batsman: "bg-info/10 text-info border-info/20",
  bowler: "bg-destructive/10 text-destructive border-destructive/20",
  all_rounder: "bg-primary/10 text-primary border-primary/20",
  wicket_keeper: "bg-warning/10 text-warning border-warning/20",
  wicket_keeper_batsman: "bg-warning/10 text-warning border-warning/20",
}

export default async function PlayersPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const players = DEMO_PLAYERS

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <MotionWrapper variant="fadeInLeft">
          <h1 className="text-3xl font-bold tracking-tight">Players</h1>
          <p className="text-muted-foreground mt-1">Register players and manage profiles.</p>
        </MotionWrapper>
        <MotionWrapper variant="fadeInRight">
          <Link href="/dashboard/players/new">
            <Button variant="gradient-shine" size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </Link>
        </MotionWrapper>
      </div>

      {/* Stats Bar */}
      <MotionWrapper variant="fadeInUp" delay={0.1}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-bold tabular-nums">{players.length}</p>
            <p className="text-xs text-muted-foreground">Total Players</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-bold tabular-nums text-success">{players.filter(p => p.status === "active").length}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-bold tabular-nums text-warning">{players.filter(p => p.status === "injured").length}</p>
            <p className="text-xs text-muted-foreground">Injured</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-bold tabular-nums">{new Set(players.map(p => p.teamName)).size}</p>
            <p className="text-xs text-muted-foreground">Teams</p>
          </div>
        </div>
      </MotionWrapper>

      {/* Data Table */}
      <MotionWrapper variant="fadeInUp" delay={0.2}>
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Team</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {players.map((player) => (
                  <tr key={player.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-muted-foreground">#{player.jerseyNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/players/${player.id}`} className="flex items-center gap-3 group-hover:text-primary transition-colors">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                          {player.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{player.name}</p>
                          <p className="text-xs text-muted-foreground">{player.battingStyle === "left" ? "Left-hand" : "Right-hand"} bat</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs ${ROLE_COLORS[player.role] ?? ""}`}>
                        {ROLE_LABELS[player.role] ?? player.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{player.teamName}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{player.city}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`text-xs capitalize ${STATUS_COLORS[player.status] ?? ""}`}>
                        {player.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/players/${player.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </MotionWrapper>
    </div>
  )
}
