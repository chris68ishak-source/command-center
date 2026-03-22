import { NextRequest, NextResponse } from "next/server";
import { Anthropic } from "@anthropic-ai/sdk";
import { getContacts, getCampaignById, updateCampaignStatus, logCampaignSend, createCampaign } from "@/lib/db/queries";
import { companyConfig, apiConfig } from "@/lib/config";

const anthropic = new Anthropic({ apiKey: apiConfig.anthropicApiKey });

// ─────────────────────────────────────────────────────────────
//  Campaign Send Agent
//  1. Generate campaign content with AI (if requested)
//  2. Send to all subscribed contacts via Resend
//  3. Track every send in the database
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      return NextResponse.json({
        success: false,
        error: "RESEND_API_KEY not configured. Add it to your Vercel environment variables.",
      }, { status: 500 });
    }

    let campaignId = body.campaignId;
    let campaign;

    // ── Option 1: Send an existing campaign ──
    if (campaignId) {
      campaign = await getCampaignById(campaignId);
      if (!campaign) {
        return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
      }
    }

    // ── Option 2: Generate + create a new campaign with AI ──
    if (!campaign && body.prompt) {
      const aiContent = await generateCampaignContent(body.prompt);
      if (!aiContent) {
        return NextResponse.json({ success: false, error: "Failed to generate campaign content" }, { status: 500 });
      }
      campaign = await createCampaign({
        name: aiContent.name,
        subject: aiContent.subject,
        bodyHtml: aiContent.bodyHtml,
        bodyText: aiContent.bodyText,
      });
      campaignId = campaign.id;
    }

    if (!campaign) {
      return NextResponse.json({ success: false, error: "Provide campaignId or prompt" }, { status: 400 });
    }

    // ── Get all subscribed contacts ──
    const contacts = await getContacts(true);
    if (contacts.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No subscribed contacts. Add contacts to your list first.",
      }, { status: 400 });
    }

    // ── Send emails via Resend ──
    let delivered = 0;
    let failed = 0;

    await updateCampaignStatus(campaignId, "sending");

    for (const contact of contacts) {
      try {
        // Personalize the email
        const personalizedHtml = campaign.body_html
          .replace(/\{\{name\}\}/g, contact.name.split(" ")[0])
          .replace(/\{\{full_name\}\}/g, contact.name)
          .replace(/\{\{city\}\}/g, contact.city || "your area");

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${companyConfig.name} <noreply@protouchconstruction.ca>`,
            to: contact.email,
            subject: campaign.subject.replace(/\{\{name\}\}/g, contact.name.split(" ")[0]),
            html: personalizedHtml,
            headers: {
              "List-Unsubscribe": `<mailto:unsubscribe@protouchconstruction.ca?subject=unsubscribe>`,
            },
          }),
        });

        const result = await res.json();

        if (res.ok && result.id) {
          delivered++;
          await logCampaignSend({
            campaignId,
            contactId: contact.id,
            email: contact.email,
            status: "delivered",
            resendId: result.id,
          });
        } else {
          failed++;
          await logCampaignSend({
            campaignId,
            contactId: contact.id,
            email: contact.email,
            status: "failed",
            error: JSON.stringify(result),
          });
        }

        // Rate limit: small delay between sends to avoid hitting Resend limits
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        failed++;
        await logCampaignSend({
          campaignId,
          contactId: contact.id,
          email: contact.email,
          status: "failed",
          error: String(err),
        });
      }
    }

    // ── Update campaign stats ──
    await updateCampaignStatus(campaignId, "sent", {
      sent: contacts.length,
      delivered,
      failed,
    });

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaignId,
        name: campaign.name || campaign.subject,
        subject: campaign.subject,
      },
      stats: {
        total: contacts.length,
        delivered,
        failed,
      },
    });
  } catch (error) {
    console.error("Campaign send error:", error);
    return NextResponse.json({ success: false, error: "Campaign send failed" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────
//  AI Campaign Generator
// ─────────────────────────────────────────────────────────────

async function generateCampaignContent(prompt: string) {
  try {
    const now = new Date();
    const month = now.toLocaleString("en-CA", { month: "long", timeZone: "America/Vancouver" });
    const year = now.getFullYear();

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are writing an email campaign for ${companyConfig.name}, a family-owned renovation, deck, and fencing company in ${companyConfig.city} serving BC's Lower Mainland since 1994. The owner is ${companyConfig.ownerName}.

Current month: ${month} ${year}
Services: ${companyConfig.services.join(", ")}
Phone: 778-846-3619
Website: www.protouchconstruction.ca/free-quote

Campaign request: ${prompt}

Generate a complete email campaign. Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "name": "Short campaign name (3-5 words)",
  "subject": "Email subject line (compelling, under 60 chars). Can use {{name}} for personalization.",
  "bodyText": "Plain text version of the email. Use {{name}} for first name, {{city}} for their city. Keep it short, warm, personal — like Chris is writing to a neighbor. 150-200 words max. Include a call to action with the phone number and website link.",
  "bodyHtml": "HTML version with inline styles. Use a clean, simple design: white background, dark text, red (#C41E2A) accent color for headings and CTA button. Include {{name}} and {{city}} placeholders. Must include an unsubscribe note at the bottom. Keep it short and personal — not corporate."
}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    // Strip any markdown code blocks if present
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI campaign generation failed:", error);
    return null;
  }
}
