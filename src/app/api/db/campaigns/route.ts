import { NextRequest, NextResponse } from "next/server";
import { createCampaign, getCampaigns } from "@/lib/db/queries";

export async function GET() {
  try {
    const campaigns = await getCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.subject || !body.bodyHtml || !body.bodyText) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    const campaign = await createCampaign({
      name: body.name,
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      bodyText: body.bodyText,
    });
    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Failed to create campaign:", error);
    return NextResponse.json({ success: false, error: "Failed to create campaign" }, { status: 500 });
  }
}
