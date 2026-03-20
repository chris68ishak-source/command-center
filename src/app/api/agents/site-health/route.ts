import { NextRequest, NextResponse } from "next/server";
import { generateSiteHealthReport } from "@/lib/agents/siteHealthMonitor";

// POST /api/agents/site-health
// Body (optional): { url: "https://example.com" }

export async function POST(request: NextRequest) {
  try {
    let url: string | undefined;
    try {
      const body = await request.json();
      url = body.url;
    } catch {
      // No body — uses default company website
    }

    const report = await generateSiteHealthReport(url);
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Site health monitor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const report = await generateSiteHealthReport();
    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Site health monitor error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
