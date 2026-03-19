import { NextRequest, NextResponse } from "next/server";
import { generateMorningBriefing } from "@/lib/agents/morningBriefing";
import { apiConfig } from "@/lib/config";

// GET /api/cron/daily
// Vercel Cron: runs every day at 7am (see vercel.json)
// Runs: Morning Briefing + Quote Follow-Up (Phase 3)

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${apiConfig.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // Agent 1: Morning Briefing
  try {
    results.morningBriefing = await generateMorningBriefing();
  } catch (e) {
    errors.push(`morningBriefing: ${e}`);
  }

  // Agent 2: Quote Follow-Up (Phase 3 — stub for now)
  results.quoteFollowUp = {
    status: "pending_phase3",
    message: "Quote follow-up agent will be wired to Jobber API in Phase 3",
  };

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
