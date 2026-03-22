import { NextRequest, NextResponse } from "next/server";
import { createQuote, createContact } from "@/lib/db/queries";

// POST /api/webhook/lead — receives new leads from the Pro Touch website
// Called automatically when someone submits the free quote form
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret — ALWAYS required in production
    const authHeader = request.headers.get("authorization");
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email, service, city, details, contact } = body;

    if (!name || !phone || !service) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Map website form fields to Command Center quote fields
    const quote = await createQuote({
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: (email || "").trim(),
      quoteAmount: 0, // Unknown until you price it
      projectType: service.trim(),
      description: [
        city ? `Area: ${city.trim()}` : "",
        contact ? `Prefers: ${contact.trim()}` : "",
        details ? details.trim() : "",
      ].filter(Boolean).join(" | "),
    });

    console.log(`[Webhook] New lead: ${name} — ${service} in ${city} → Quote #${quote.id}`);

    // Auto-add to email contacts list (if they have an email)
    if (email) {
      try {
        await createContact({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: (city || "").trim(),
          source: "website",
          tags: (service || "").trim(),
        });
        console.log(`[Webhook] Contact added to email list: ${email}`);
      } catch (contactErr) {
        console.error("[Webhook] Failed to add contact:", contactErr);
        // Non-blocking — lead is still captured even if contact add fails
      }
    }

    return NextResponse.json({
      success: true,
      quoteId: quote.id,
      message: `Lead captured: ${name}`,
    }, { status: 201 });
  } catch (error) {
    console.error("[Webhook] Lead capture error:", error);
    return NextResponse.json({ error: "Failed to capture lead" }, { status: 500 });
  }
}
