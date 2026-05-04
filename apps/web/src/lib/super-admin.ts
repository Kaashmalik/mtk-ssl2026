import { currentUser } from "@clerk/nextjs/server"

const DEFAULT_SUPER_ADMIN_EMAIL = "kashif@maliktech.pk"

export async function isSuperAdmin(): Promise<boolean> {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return false
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || DEFAULT_SUPER_ADMIN_EMAIL
  return email.toLowerCase() === superAdminEmail.toLowerCase()
}
