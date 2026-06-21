import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// NOTE: This file runs in the Edge runtime. We intentionally do NOT import
// @mtk/observability here — it uses node:crypto / node:async_hooks
// (AsyncLocalStorage) which are Node-only and crash the Edge bundle.
// Edge-compatible request-id + lightweight logging are inlined below.

// Public routes that don't require authentication.
// Cron routes are public — they authenticate via CRON_SECRET in the handler,
// not via Clerk (Vercel Cron can't obtain a Clerk session).
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/ssl(.*)",
  "/api/health",
  "/api/cron/(.*)",
  "/api/webhooks/(.*)",
  "/matches/(.*)",
  "/tournaments/(.*)",
  "/teams/(.*)",
  "/players/(.*)",
]);

/** Edge-safe request id: prefer the inbound header, else generate a UUIDv4. */
function resolveRequestId(headers: Headers): string {
  const inbound =
    headers.get("x-request-id") || headers.get("x-correlation-id");
  if (inbound) return inbound;
  // Web Crypto is available in the Edge runtime.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Last-resort fallback for runtimes without crypto.randomUUID.
  return "rid-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const requestId = resolveRequestId(request.headers);
  const path = request.nextUrl?.pathname ?? request.url;
  const method = request.method;

  try {
    const host = request.headers.get("host") || "";
    const { subdomain } = getTenantFromHost(host);

    // Rate limiting for mutation requests (POST, PUT, PATCH, DELETE)
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const authData = auth as unknown as { sessionClaims?: { sub?: string } };
      const userId = authData.sessionClaims?.sub;

      // Fallback to IP address if no userId is present
      const ip =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "127.0.0.1";
      const key = userId ? `user:${userId}` : `ip:${ip}`;

      // Limit to 60 requests per minute.
      // `rateLimit` is async — it uses Redis when available (Node runtime)
      // and falls back to in-memory on Edge runtime.
      const { success, remaining, reset } = await rateLimit(key, 60, 60000);

      if (!success) {
        console.warn("[middleware] Rate limit exceeded", { key, path });
        return new NextResponse(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": "60",
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
              "X-Request-Id": requestId,
            },
          }
        );
      }
    }

    // Create response with tenant info in headers (actual tenant lookup happens in server components/API)
    const response = NextResponse.next();
    response.headers.set("X-Request-Id", requestId);

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
  } catch (err) {
    // Any uncaught error must be surfaced as a 500 rather than crashing silently.
    // Structured logging + Sentry capture happens in the server components/API
    // (Node runtime) — here we only emit a console record.
    console.error("[middleware] Internal error", {
      requestId,
      method,
      path,
      error: err instanceof Error ? err.message : String(err),
    });
    return new NextResponse(
      JSON.stringify({ error: "Internal middleware error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "X-Request-Id": requestId },
      }
    );
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
