import { NextRequest, NextResponse } from "next/server";
import { sendReviewRequest } from "@/lib/agents/reviewRequester";
import { logReviewRequest } from "@/lib/db/queries";
import { ReviewRequest } from "@/types";

// POST /api/agents/review-requester
// Trigger: called after a job is marked complete
// Body: { customerName, customerPhone, projectType, jobId }
//
// Integration options:
//  - Jobber webhook → point to this URL on job completion
//  - Manual: hit this from your dashboard "Send Review Request" button
//  - Future: auto-trigger from Jobber automation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReviewRequest;

    if (!body.customerName || !body.customerPhone || !body.projectType) {
      return NextResponse.json(
        { error: "Missing required fields: customerName, customerPhone, projectType" },
        { status: 400 }
      );
    }

    // Basic phone validation
    const phoneClean = body.customerPhone.replace(/\D/g, "");
    if (phoneClean.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    const result = await sendReviewRequest(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send review request" },
        { status: 500 }
      );
    }

    // Log to database
    try {
      await logReviewRequest({
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        projectType: body.projectType,
        messageSent: result.message,
        twilioSid: result.sid,
      });
    } catch {
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      messageSent: result.message,
      twilioSid: result.sid,
      customer: body.customerName,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Review requester error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
