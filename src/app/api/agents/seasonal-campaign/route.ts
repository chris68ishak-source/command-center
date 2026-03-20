import { NextResponse } from "next/server";
import { generateSeasonalCampaign } from "@/lib/agents/seasonalCampaigner";

// GET or POST /api/agents/seasonal-campaign

export async function POST() {
  try {
    const campaign = await generateSeasonalCampaign();
    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Seasonal campaigner error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const campaign = await generateSeasonalCampaign();
    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Seasonal campaigner error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
