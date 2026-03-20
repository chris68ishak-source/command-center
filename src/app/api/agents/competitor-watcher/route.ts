import { NextRequest, NextResponse } from "next/server";
import { generateCompetitorReport } from "@/lib/agents/competitorWatcher";

// POST /api/agents/competitor-watcher
// Body (optional): { competitors: ["Company A", "Company B"] }

export async function POST(request: NextRequest) {
  try {
    let competitors: string[] | undefined;
    try {
      const body = await request.json();
      competitors = body.competitors;
    } catch {
      // No body — uses default competitors
    }

    const report = await generateCompetitorReport(competitors);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Competitor watcher error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const report = await generateCompetitorReport();
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Competitor watcher error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
