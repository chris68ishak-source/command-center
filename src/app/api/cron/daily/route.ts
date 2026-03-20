import { NextRequest, NextResponse } from "next/server";
import { generateMorningBriefing } from "@/lib/agents/morningBriefing";
import { generateWeeklyContent } from "@/lib/agents/contentGenerator";
import { apiConfig } from "@/lib/config";

// GET /api/cron/daily
// Vercel Cron: runs every day at 7am PT (see vercel.json)
// Runs: Morning Briefing daily + Content Generator on Mondays

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${apiConfig.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  // Agent 1: Morning Briefing (daily)
  try {
    results.morningBriefing = await generateMorningBriefing();
  } catch (e) {
    errors.push(`morningBriefing: ${e}`);
  }

  // Agent 4: Quote Follow-Up (Phase 3 — will auto-pull from Jobber)
  results.quoteFollowUp = {
    status: "manual_trigger",
    message: "Quote follow-ups run from dashboard. Auto-mode coming in Phase 3 with Jobber API.",
  };

  // Agent 5: Content Generator (Mondays only)
  const today = new Date();
  if (today.getDay() === 1) {
    try {
      results.contentGenerator = await generateWeeklyContent();
    } catch (e) {
      errors.push(`contentGenerator: ${e}`);
    }
  } else {
    results.contentGenerator = {
      status: "skipped",
      message: "Content generation runs on Mondays only",
      nextRun: "Monday",
    };
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
