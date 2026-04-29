"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@mtk/ui/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import {
  LayoutDashboard, Users, Trophy, CalendarDays, Sword, Settings,
  ChevronLeft, ChevronRight, Radio, BarChart3, Gamepad2
} from "lucide-react"
import { Button } from "@mtk/ui/components/ui/button"

const navGroups = [
  {
    label: "Management",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "⌘1" },
      { name: "Teams", href: "/dashboard/teams", icon: Users, shortcut: "⌘2" },
      { name: "Players", href: "/dashboard/players", icon: Sword, shortcut: "⌘3" },
      { name: "Matches", href: "/dashboard/matches", icon: CalendarDays, shortcut: "⌘4", badge: "live" },
      { name: "Tournaments", href: "/dashboard/tournaments", icon: Trophy, shortcut: "⌘5" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { name: "Statistics", href: "/dashboard/stats", icon: BarChart3 },
      { name: "Scoring", href: "/dashboard/scoring", icon: Gamepad2 },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Keyboard shortcut to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "[" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCollapsed((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 280 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="hidden md:flex flex-col border-r glass-panel h-screen sticky top-0 z-40 overflow-hidden"
    >
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold overflow-hidden">
          <Trophy className="h-6 w-6 text-primary shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap text-sm"
              >
                Shakir Super League
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 shrink-0"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin py-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-2">
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="grid gap-0.5 px-2">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                      "hover:bg-primary/8 hover:text-foreground",
                      isActive
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-muted-foreground"
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="flex items-center justify-between flex-1 overflow-hidden"
                        >
                          <span className="whitespace-nowrap">{item.name}</span>
                          <div className="flex items-center gap-1.5">
                            {item.badge === "live" && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
                              </span>
                            )}
                            {item.shortcut && (
                              <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground/60">
                                {item.shortcut}
                              </kbd>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section at bottom */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="border-t p-3"
          >
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                MK
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">Muhammad Kashif</p>
                <p className="text-xs text-muted-foreground truncate">Super Admin</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
