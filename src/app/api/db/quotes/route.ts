import { NextRequest, NextResponse } from "next/server";
import { createQuote, getQuotes, getQuoteStats, updateQuoteStatus, updateQuoteFollowUp } from "@/lib/db/queries";
import { logFollowUp } from "@/lib/db/queries";

// GET /api/db/quotes — list all quotes, optionally filter by status
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") || undefined;
    const stats = request.nextUrl.searchParams.get("stats");

    if (stats === "true") {
      const quoteStats = await getQuoteStats();
      return NextResponse.json({ success: true, stats: quoteStats });
    }

    const quotes = await getQuotes(status);
    return NextResponse.json({ success: true, quotes });
  } catch (error) {
    console.error("Get quotes error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/db/quotes — create a new quote or update existing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Update status
    if (body.action === "updateStatus" && body.id) {
      const quote = await updateQuoteStatus(body.id, body.status);
      return NextResponse.json({ success: true, quote });
    }

    // Log follow-up
    if (body.action === "followUp" && body.id) {
      const quote = await updateQuoteFollowUp(body.id, body.message);
      if (body.twilioSid) {
        await logFollowUp({ quoteId: body.id, messageSent: body.message, twilioSid: body.twilioSid });
      }
      return NextResponse.json({ success: true, quote });
    }

    // Create new quote
    if (!body.customerName || !body.customerPhone || !body.quoteAmount || !body.projectType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const quote = await createQuote(body);
    return NextResponse.json({ success: true, quote });
  } catch (error) {
    console.error("Quote operation error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
