import { currentUser } from "@clerk/nextjs/server"

export async function isSuperAdmin(): Promise<boolean> {
  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress
  if (!email) return false
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
  if (!superAdminEmail) return false
  return email.toLowerCase() === superAdminEmail.toLowerCase()
}
