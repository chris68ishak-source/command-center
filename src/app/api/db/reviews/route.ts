import { NextRequest, NextResponse } from "next/server";
import { getReviewRequests } from "@/lib/db/queries";
import { requireAuth } from "@/lib/auth";

// GET /api/db/reviews — list all review requests sent
export async function GET(request: NextRequest) {
  const denied = requireAuth(request);
  if (denied) return denied;

  try {
    const reviews = await getReviewRequests();
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
