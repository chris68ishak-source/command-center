import Anthropic from "@anthropic-ai/sdk";
import twilio from "twilio";
import { apiConfig, companyConfig } from "@/lib/config";
import { QuoteFollowUp } from "@/types";

// ─────────────────────────────────────────────────────────────
//  Agent 4: Quote Follow-Up
//  Triggered: manually from dashboard or daily cron
//  What it does:
//    1. Takes a list of quotes that haven't been responded to
//    2. Uses Claude to write a personalized follow-up SMS
//    3. Sends via Twilio to nudge the customer
//  Phase 3 upgrade: pull open quotes from Jobber API automatically
// ─────────────────────────────────────────────────────────────

export interface FollowUpResult {
  success: boolean;
  message: string;
  sid?: string;
  error?: string;
  customerName: string;
}

export async function sendQuoteFollowUp(
  quote: QuoteFollowUp
): Promise<FollowUpResult> {
  const anthropic = new Anthropic({ apiKey: apiConfig.anthropicApiKey });

  const daysSinceSent = Math.floor(
    (Date.now() - new Date(quote.sentAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const prompt = `You are writing a short, friendly follow-up SMS for ${companyConfig.name}, a construction company in ${companyConfig.city}.

The customer is: ${quote.customerName}
They received a quote for: ${quote.projectType}
Quote amount: $${quote.quoteAmount.toLocaleString()}
Days since quote was sent: ${daysSinceSent}
Company owner's name: ${companyConfig.ownerName}

Write a single SMS message (max 160 characters) that:
- Feels personal and warm, NOT pushy or salesy
- Casually checks in about the quote
- Mentions their specific project
- Makes it easy for them to reply (e.g. "just text back" or "happy to answer questions")
- If it's been 5+ days, add gentle urgency like seasonal demand

IMPORTANT: Return ONLY the SMS text, nothing else. No quotes, no explanation.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const smsText =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  if (!smsText) {
    return {
      success: false,
      message: "",
      customerName: quote.customerName,
      error: "Claude returned empty message",
    };
  }

  // Send via Twilio
  if (
    !apiConfig.twilioAccountSid ||
    !apiConfig.twilioAuthToken ||
    !apiConfig.twilioFromNumber
  ) {
    return {
      success: true,
      message: smsText,
      sid: "DEV_MODE_NO_SID",
      customerName: quote.customerName,
    };
  }

  const client = twilio(apiConfig.twilioAccountSid, apiConfig.twilioAuthToken);

  const twilioMessage = await client.messages.create({
    body: smsText,
    from: apiConfig.twilioFromNumber,
    to: quote.customerPhone,
  });

  return {
    success: true,
    message: smsText,
    sid: twilioMessage.sid,
    customerName: quote.customerName,
  };
}
