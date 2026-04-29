"use client"

import * as React from "react"
import { Command } from "cmdk"
import { Search, Trophy, Users, CalendarDays, Settings } from "lucide-react"

import { cn } from "../../lib/utils"

interface CommandPaletteProps {
  router?: { push: (path: string) => void }
}

export function CommandPalette({ router }: CommandPaletteProps = {}) {
  const [open, setOpen] = React.useState(false)

  // Toggle the menu when ⌘K is pressed
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200">
      <div className="fixed inset-0" onClick={() => setOpen(false)} />
      
      <Command 
        className={cn(
          "relative z-50 flex h-full w-full max-w-[640px] flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl",
          "animate-in zoom-in-95 duration-200",
          "sm:h-[400px]"
        )}
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input 
            placeholder="Type a command or search..." 
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            autoFocus
          />
        </div>
        
        <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
          <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>
          
          <Command.Group heading="Links" className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            <Command.Item
              onSelect={() => runCommand(() => router?.push("/dashboard"))}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Dashboard
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router?.push("/dashboard/teams"))}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
            >
              <Users className="mr-2 h-4 w-4" />
              Teams
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router?.push("/dashboard/matches"))}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Matches
            </Command.Item>
            <Command.Item
              onSelect={() => runCommand(() => router?.push("/dashboard/settings"))}
              className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  )
}
