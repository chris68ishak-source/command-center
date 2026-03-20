import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initializeDatabase } from "@/lib/db/schema";
import { requireAdminAuth } from "@/lib/auth";

// GET /api/db/migrate — drop old tables and recreate with correct schema
// WARNING: This deletes all data. Requires CRON_SECRET bearer token.
export async function GET(request: NextRequest) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    await sql`DROP TABLE IF EXISTS follow_up_log CASCADE`;
    await sql`DROP TABLE IF EXISTS review_requests CASCADE`;
    await sql`DROP TABLE IF EXISTS jobs CASCADE`;
    await sql`DROP TABLE IF EXISTS quotes CASCADE`;

    const result = await initializeDatabase();

    return NextResponse.json({
      success: true,
      message: "Migration complete — old tables dropped, new schema created",
      init: result,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
