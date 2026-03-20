import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { initializeDatabase } from "@/lib/db/schema";

// GET /api/db/migrate — drop old tables and recreate with correct schema
// WARNING: This deletes all data. Only use for initial setup.
export async function GET() {
  try {
    // Drop tables in reverse dependency order
    await sql`DROP TABLE IF EXISTS follow_up_log CASCADE`;
    await sql`DROP TABLE IF EXISTS review_requests CASCADE`;
    await sql`DROP TABLE IF EXISTS jobs CASCADE`;
    await sql`DROP TABLE IF EXISTS quotes CASCADE`;

    // Recreate with correct schema
    const result = await initializeDatabase();

    return NextResponse.json({
      success: true,
      message: "Migration complete — old tables dropped, new schema created",
      init: result,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
