import { NextRequest, NextResponse } from "next/server";
import { generateMorningBriefing } from "@/lib/agents/morningBriefing";
import { generateWeeklyContent } from "@/lib/agents/contentGenerator";
import { generateSiteHealthReport } from "@/lib/agents/siteHealthMonitor";
import { generateCompetitorReport } from "@/lib/agents/competitorWatcher";
import { generateSeasonalCampaign } from "@/lib/agents/seasonalCampaigner";
import { apiConfig } from "@/lib/config";

// GET /api/cron/daily
// Vercel Cron: runs every day at 7am PT (see vercel.json)
// Daily: Morning Briefing
// Mondays: Content Generator + Site Health + Competitor Watch
// 1st of month: Seasonal Campaign

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${apiConfig.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const errors: string[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
  const dayOfMonth = today.getDate();

  // ── Daily: Morning Briefing ──
  try {
    results.morningBriefing = await generateMorningBriefing();
  } catch (e) {
    errors.push(`morningBriefing: ${e}`);
  }

  // ── Mondays: Content Generator ──
  if (dayOfWeek === 1) {
    try {
      results.contentGenerator = await generateWeeklyContent();
    } catch (e) {
      errors.push(`contentGenerator: ${e}`);
    }
  }

  // ── Sundays: Site Health Monitor ──
  if (dayOfWeek === 0) {
    try {
      results.siteHealth = await generateSiteHealthReport();
    } catch (e) {
      errors.push(`siteHealth: ${e}`);
    }
  }

  // ── Wednesdays: Competitor Watcher ──
  if (dayOfWeek === 3) {
    try {
      results.competitorWatcher = await generateCompetitorReport();
    } catch (e) {
      errors.push(`competitorWatcher: ${e}`);
    }
  }

  // ── 1st of Month: Seasonal Campaign ──
  if (dayOfMonth === 1) {
    try {
      results.seasonalCampaign = await generateSeasonalCampaign();
    } catch (e) {
      errors.push(`seasonalCampaign: ${e}`);
    }
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    dayOfWeek,
    dayOfMonth,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
