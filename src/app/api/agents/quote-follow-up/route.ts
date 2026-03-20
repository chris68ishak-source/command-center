import { NextRequest, NextResponse } from "next/server";
import { sendQuoteFollowUp } from "@/lib/agents/quoteFollowUp";
import { QuoteFollowUp } from "@/types";

// POST /api/agents/quote-follow-up
// Trigger: manual from dashboard or daily cron
// Body: { customerName, customerPhone, quoteAmount, projectType, sentAt, jobId }

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QuoteFollowUp;

    if (
      !body.customerName ||
      !body.customerPhone ||
      !body.quoteAmount ||
      !body.projectType ||
      !body.sentAt
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: customerName, customerPhone, quoteAmount, projectType, sentAt",
        },
        { status: 400 }
      );
    }

    const phoneClean = body.customerPhone.replace(/\D/g, "");
    if (phoneClean.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    const result = await sendQuoteFollowUp(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send follow-up" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageSent: result.message,
      twilioSid: result.sid,
      customer: body.customerName,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Quote follow-up error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
