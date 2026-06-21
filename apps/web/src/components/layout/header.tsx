"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import { Search, Menu, Radio, Bell } from "lucide-react"
import { Button } from "@mtk/ui/components/ui/button"
import { ThemeToggle } from "@mtk/ui/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger } from "@mtk/ui/components/ui/sheet"
import { useState, useEffect, useCallback } from "react"
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandShortcut,
} from "@mtk/ui/components/ui/command-palette"
import {
  LayoutDashboard, Users, Trophy, CalendarDays, Sword, Settings, BarChart3
} from "lucide-react"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Teams", href: "/dashboard/teams", icon: Users },
  { name: "Players", href: "/dashboard/players", icon: Sword },
  { name: "Matches", href: "/dashboard/matches", icon: CalendarDays },
  { name: "Tournaments", href: "/dashboard/tournaments", icon: Trophy },
  { name: "Statistics", href: "/dashboard/stats", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [commandOpen, setCommandOpen] = useState(false)

  // ⌘K to open command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = useCallback((command: () => void) => {
    setCommandOpen(false)
    command()
  }, [])

  // Build breadcrumb from pathname
  const segments = pathname.split("/").filter(Boolean)
  const breadcrumbs = segments.map((segment, i) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }))

  return (
    <>
      <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-background/60 backdrop-blur-xl px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30 transition-all duration-300">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col w-72">
            <nav className="grid gap-1 text-sm font-medium mt-6">
              <Link href="/" className="flex items-center gap-2 font-semibold mb-4 px-3">
                <Trophy className="h-6 w-6 text-primary" />
                <span>Shakir Super League</span>
              </Link>
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-border">/</span>}
              {crumb.isLast ? (
                <span className="font-medium text-foreground">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Command Palette Trigger */}
        <Button
          variant="outline"
          className="hidden sm:flex items-center gap-2 text-muted-foreground h-9 w-64 justify-start rounded-xl border-accent/20"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-sm">Search...</span>
          <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            ⌘K
          </kbd>
        </Button>

        {/* Go Live Button */}
        <Button variant="outline" size="sm" className="hidden lg:flex items-center gap-1.5 text-live border-live/30 hover:bg-live/10">
          <Radio className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Go Live</span>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-live text-[10px] font-bold text-white flex items-center justify-center">
            3
          </span>
        </Button>

        <ThemeToggle />
        <UserButton afterSignOutUrl="/" />
      </header>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search teams, players, matches..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navigation.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/teams/new"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Create Team</span>
              <CommandShortcut>⌘T</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/matches/new"))}>
              <CalendarDays className="mr-2 h-4 w-4" />
              <span>Schedule Match</span>
              <CommandShortcut>⌘M</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
