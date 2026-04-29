import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mtk/ui/components/ui/card"
import { Button } from "@mtk/ui/components/ui/button"
import { StatCard } from "@mtk/ui/components/ui/stat-card"
import { Skeleton } from "@mtk/ui/components/ui/skeleton"
import { MotionWrapper, MotionItem } from "@mtk/ui/components/ui/motion-wrapper"
import { Badge } from "@mtk/ui/components/ui/badge"
import { Plus, Trophy, Users, CalendarDays, ArrowRight, Sword, Radio, TrendingUp, Zap, Clock } from "lucide-react"

// Dashboard Stats Component
async function DashboardStats() {
  // In production, these come from getDashboardStats()
  // For now using realistic demo data to showcase the UI
  const stats = {
    totalTeams: 24,
    totalPlayers: 312,
    totalTournaments: 8,
    totalMatches: 156,
    activeMatches: 3,
    previousTeams: 20,
    previousPlayers: 280,
    previousTournaments: 6,
    previousMatches: 120,
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Teams"
        value={stats.totalTeams}
        previousValue={stats.previousTeams}
        trendLabel="from last month"
        icon={<Users className="h-full w-full" />}
        accentColor="oklch(0.6 0.16 145)"
        delay={0}
      />
      <StatCard
        title="Active Players"
        value={stats.totalPlayers}
        previousValue={stats.previousPlayers}
        trendLabel="from last month"
        icon={<Sword className="h-full w-full" />}
        accentColor="oklch(0.6 0.15 240)"
        delay={1}
      />
      <StatCard
        title="Tournaments"
        value={stats.totalTournaments}
        previousValue={stats.previousTournaments}
        trendLabel="from last month"
        icon={<Trophy className="h-full w-full" />}
        accentColor="oklch(0.7 0.15 80)"
        delay={2}
      />
      <StatCard
        title="Total Matches"
        value={stats.totalMatches}
        previousValue={stats.previousMatches}
        trendLabel="from last month"
        icon={<CalendarDays className="h-full w-full" />}
        accentColor="oklch(0.65 0.2 300)"
        delay={3}
      />
    </div>
  )
}

function StatsLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl border bg-card p-6">
          <Skeleton className="h-4 w-24 mb-4" />
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

// Live Matches Section
function LiveMatchesBanner() {
  // Demo data — replace with getLiveMatches() in production
  const liveMatches = [
    { id: "1", team1: "Lahore Lions", team2: "Karachi Kings", score1: "165/4", score2: "98/3", overs2: "12.4", target: 166 },
  ]

  if (liveMatches.length === 0) return null

  return (
    <MotionWrapper variant="fadeInUp" delay={0.2}>
      <Card className="border-live/20 bg-gradient-to-r from-live/5 via-transparent to-live/5 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-live via-live/60 to-transparent" />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-live" />
            </span>
            <CardTitle className="text-base font-semibold">Live Now</CardTitle>
            <Badge variant="outline" className="text-live border-live/30 text-xs">
              {liveMatches.length} match{liveMatches.length > 1 ? "es" : ""}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {liveMatches.map((match) => (
              <Link key={match.id} href={`/dashboard/matches/${match.id}`} className="block">
                <div className="flex items-center justify-between p-3 rounded-xl bg-card/50 hover:bg-card transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm">{match.team1}</span>
                      <span className="font-bold text-base tabular-nums">{match.score1}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{match.team2}</span>
                      <span className="font-bold text-base tabular-nums">{match.score2}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {match.team2} need {match.target - parseInt(match.score2)} runs from {(20 * 6 - parseFloat(match.overs2) * 6).toFixed(0)} balls
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-4" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </MotionWrapper>
  )
}

// Quick Actions Section
function QuickActions() {
  const actions = [
    { label: "Create Tournament", description: "Set up a new league or knockout", href: "/dashboard/tournaments/new", icon: Trophy, color: "text-primary" },
    { label: "Register Team", description: "Add a new team to your league", href: "/dashboard/teams/new", icon: Users, color: "text-info" },
    { label: "Add Player", description: "Create player profile", href: "/dashboard/players/new", icon: Sword, color: "text-success" },
    { label: "Schedule Match", description: "Create a fixture", href: "/dashboard/matches/new", icon: CalendarDays, color: "text-warning" },
  ]

  return (
    <Card className="glass-panel-subtle border-none">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button key={action.href} variant="outline" className="w-full justify-start h-auto py-3 text-left group" asChild>
            <Link href={action.href}>
              <div className="flex items-center w-full">
                <div className={`p-2 rounded-xl mr-3 bg-muted/50 ${action.color} group-hover:bg-primary/10 transition-colors`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold block text-sm">{action.label}</span>
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}

// Upcoming Matches Timeline
function UpcomingMatches() {
  const upcoming = [
    { id: "1", team1: "Islamabad United", team2: "Peshawar Zalmi", time: "Today, 7:00 PM", venue: "Rawalpindi Stadium" },
    { id: "2", team1: "Multan Sultans", team2: "Quetta Gladiators", time: "Tomorrow, 3:00 PM", venue: "Multan Cricket Stadium" },
    { id: "3", team1: "Lahore Lions", team2: "Faisalabad Wolves", time: "Apr 29, 5:00 PM", venue: "Gaddafi Stadium" },
  ]

  return (
    <Card className="glass-panel-subtle border-none">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-info" />
          <CardTitle className="text-base">Upcoming Matches</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcoming.map((match, i) => (
            <div key={match.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                {i < upcoming.length - 1 && <div className="w-px h-full bg-border min-h-[40px]" />}
              </div>
              <div className="flex-1 pb-2">
                <p className="font-medium text-sm">{match.team1} vs {match.team2}</p>
                <p className="text-xs text-muted-foreground">{match.time}</p>
                <p className="text-xs text-muted-foreground">{match.venue}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Recent Activity Feed
function RecentActivity() {
  const activities = [
    { type: "match", message: "Lahore Lions won by 6 wickets vs Karachi Kings", time: "2 hours ago" },
    { type: "team", message: "New team 'Sialkot Stallions' registered", time: "5 hours ago" },
    { type: "player", message: "Ahmed scored his first century (112*)", time: "Yesterday" },
    { type: "tournament", message: "SSL Premier League 2026 schedule published", time: "2 days ago" },
  ]

  return (
    <Card className="glass-panel-subtle border-none">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mt-2 shrink-0" />
              <div>
                <p className="text-sm">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <MotionWrapper variant="fadeInLeft">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back to your command center.</p>
        </MotionWrapper>
        <MotionWrapper variant="fadeInRight">
          <Link href="/dashboard/tournaments/new">
            <Button className="flex items-center gap-2 shadow-lg hover:shadow-primary/25" size="lg" variant="gradient-shine">
              <Plus className="w-4 h-4" />
              Create Tournament
            </Button>
          </Link>
        </MotionWrapper>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsLoading />}>
        <DashboardStats />
      </Suspense>

      {/* Live Matches Banner */}
      <LiveMatchesBanner />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4 space-y-6">
          <RecentActivity />
        </div>
        <div className="lg:col-span-3 space-y-6">
          <QuickActions />
          <UpcomingMatches />
        </div>
      </div>
    </div>
  )
}
