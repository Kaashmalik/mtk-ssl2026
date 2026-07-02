import { notFound } from "next/navigation"
import { getPlayer } from "@/app/actions/players"
import { EditPlayerForm } from "@/components/players/edit-player-form"

/**
 * Edit an existing player. Server component — loads the player (tenant-scoped
 * via the action) and seeds the client form.
 */
export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const player = await getPlayer(id)
  if (!player) notFound()

  return <EditPlayerForm player={player} />
}
