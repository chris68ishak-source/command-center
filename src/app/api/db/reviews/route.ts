import { NextResponse } from "next/server";
import { getReviewRequests } from "@/lib/db/queries";

// GET /api/db/reviews — list all review requests sent
export async function GET() {
  try {
    const reviews = await getReviewRequests();
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
