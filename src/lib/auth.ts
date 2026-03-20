import { NextRequest, NextResponse } from "next/server";

/**
 * Checks if the request is from the dashboard (same-origin browser request)
 * or an authenticated API caller (bearer token).
 *
 * Dashboard pages call API routes via fetch() from the browser — these
 * come with the Referer/Origin header matching our own domain.
 * External callers (cron, webhook) must provide a Bearer token.
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  // Allow same-origin requests (dashboard UI calling its own API)
  const origin = request.headers.get("origin") || "";
  const referer = request.headers.get("referer") || "";
  const host = request.headers.get("host") || "";

  // If the request came from our own dashboard, allow it
  if (
    (origin && origin.includes(host)) ||
    (referer && referer.includes(host))
  ) {
    return null; // Authorized — proceed
  }

  // Otherwise require Bearer token (for cron jobs, webhooks, external calls)
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // Authorized — proceed
}

/**
 * Strict admin-only auth — always requires bearer token.
 * Used for destructive operations like migrate/init.
 */
export function requireAdminAuth(request: NextRequest): NextResponse | null {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || secret === "dev-secret") {
    return NextResponse.json(
      { error: "Admin endpoints require CRON_SECRET to be set" },
      { status: 403 }
    );
  }

  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
