import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/ssl(.*)",
  "/matches/(.*)",
  "/tournaments/(.*)",
  "/teams/(.*)",
  "/players/(.*)",
]);

// Extract tenant info from hostname (without database - Edge runtime compatible)
function getTenantFromHost(host: string): { subdomain: string | null } {
  // Check for subdomain pattern: {tenant}.ssl.cricket or {tenant}.localhost:3002
  const parts = host.split(".");
  if (parts.length >= 2) {
    const subdomain = parts[0];
    if (subdomain && subdomain !== "www" && subdomain !== "app" && subdomain !== "admin") {
      return { subdomain };
    }
  }
  return { subdomain: null };
}

export default clerkMiddleware(async (auth, request) => {
  const host = request.headers.get("host") || "";
  const { subdomain } = getTenantFromHost(host);
  
  // Create response with tenant info in headers (actual tenant lookup happens in server components/API)
  const response = NextResponse.next();
  
  if (subdomain) {
    response.headers.set("x-tenant-slug", subdomain);
  }

  // Handle authentication for protected routes
  if (!isPublicRoute(request)) {
    // ClerkMiddlewareAuth doesn't expose userId directly in types
    // We use sessionClaims?.sub as the user identifier
    const authData = auth as unknown as { sessionClaims?: { sub?: string } };
    const userId = authData.sessionClaims?.sub;
    if (!userId) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

