import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyContent } from "@/lib/agents/contentGenerator";

// POST /api/agents/content-generator
// Trigger: manual from dashboard or weekly cron
// Body (optional): { topic: "custom topic" }

export async function POST(request: NextRequest) {
  try {
    let topic: string | undefined;
    try {
      const body = await request.json();
      topic = body.topic;
    } catch {
      // No body is fine — uses seasonal default
    }

    const content = await generateWeeklyContent(topic);

    return NextResponse.json({
      success: true,
      content,
      generatedAt: content.generatedAt,
    });
  } catch (error) {
    console.error("Content generator error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET also works for simple trigger
export async function GET() {
  try {
    const content = await generateWeeklyContent();
    return NextResponse.json({
      success: true,
      content,
      generatedAt: content.generatedAt,
    });
  } catch (error) {
    console.error("Content generator error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
