import { NextRequest, NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/schema";
import { requireAdminAuth } from "@/lib/auth";

// GET /api/db/init — run once to create tables. Requires CRON_SECRET bearer token.
export async function GET(request: NextRequest) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const result = await initializeDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error("DB init error:", error);
    return NextResponse.json({ error: "Database initialization failed" }, { status: 500 });
  }
}
