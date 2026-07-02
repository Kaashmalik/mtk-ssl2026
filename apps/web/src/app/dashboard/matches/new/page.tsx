import { redirect } from "next/navigation"
import { getTeams } from "@/app/actions/teams"
import { NewMatchForm } from "@/components/matches/new-match-form"

/**
 * Server component — resolves the tenant's real teams on the server and passes
 * them to the client form. This replaces the previous hardcoded PSL demo teams.
 */
export default async function NewMatchPage() {
  let teams: { id: string; name: string }[] = []
  try {
    const result = await getTeams({ page: 1, pageSize: 100, isActive: true, sortBy: "name", sortOrder: "asc" })
    teams = result.data.map((t) => ({ id: t.id, name: t.name }))
  } catch {
    // If the user isn't authorized / has no tenant, redirect to onboarding.
    redirect("/dashboard/league/setup")
  }

  return <NewMatchForm teams={teams} />
}
