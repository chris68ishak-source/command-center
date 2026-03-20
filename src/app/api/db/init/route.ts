import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db/schema";

// GET /api/db/init — run once to create tables
export async function GET() {
  try {
    const result = await initializeDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error("DB init error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
