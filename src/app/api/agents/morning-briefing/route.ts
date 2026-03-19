import { NextRequest, NextResponse } from "next/server";
import { generateMorningBriefing } from "@/lib/agents/morningBriefing";
import { apiConfig } from "@/lib/config";

// GET /api/agents/morning-briefing
// Trigger: Vercel cron at 7am daily, or manual refresh from dashboard
// Protected by CRON_SECRET header

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = `Bearer ${apiConfig.cronSecret}`;

  // Allow unauthenticated in dev, require secret in prod
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== cronSecret
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const briefing = await generateMorningBriefing();
    return NextResponse.json(briefing);
  } catch (error) {
    console.error("Morning briefing error:", error);
    return NextResponse.json(
      { error: "Failed to generate briefing" },
      { status: 500 }
    );
  }
}
