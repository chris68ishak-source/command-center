import Anthropic from "@anthropic-ai/sdk";
import twilio from "twilio";
import { apiConfig, companyConfig } from "@/lib/config";
import { ReviewRequest } from "@/types";

// ─────────────────────────────────────────────────────────────
//  Agent 3: Review Requester
//  Triggered: on job completion (manual POST or Jobber webhook)
//  What it does:
//    1. Uses Claude to write a personalized, natural-sounding SMS
//    2. Sends via Twilio to the customer's phone
//    3. Returns the message sent + Twilio SID for logging
// ─────────────────────────────────────────────────────────────

export async function sendReviewRequest(
  job: ReviewRequest
): Promise<{ success: boolean; message: string; sid?: string; error?: string }> {
  const anthropic = new Anthropic({ apiKey: apiConfig.anthropicApiKey });

  // Step 1: Generate personalized message with Claude
  const prompt = `You are writing a short, friendly SMS review request for ${companyConfig.name}, a construction company in ${companyConfig.city}.

The customer is: ${job.customerName}
The project type was: ${job.projectType}
The company owner's name is: ${companyConfig.ownerName}

Write a single SMS message (max 160 characters) that:
- Feels personal and warm, not robotic
- Mentions their specific project type
- Asks for a Google review with a casual tone
- Ends with the review link: ${companyConfig.googleReviewLink}

IMPORTANT: Return ONLY the SMS text, nothing else. No quotes, no explanation.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const smsText =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  if (!smsText) {
    return { success: false, message: "", error: "Claude returned empty message" };
  }

  // Step 2: Send via Twilio
  if (
    !apiConfig.twilioAccountSid ||
    !apiConfig.twilioAuthToken ||
    !apiConfig.twilioFromNumber
  ) {
    // Dev mode: return the message without sending
    return {
      success: true,
      message: smsText,
      sid: "DEV_MODE_NO_SID",
    };
  }

  const client = twilio(apiConfig.twilioAccountSid, apiConfig.twilioAuthToken);

  const twilioMessage = await client.messages.create({
    body: smsText,
    from: apiConfig.twilioFromNumber,
    to: job.customerPhone,
  });

  return {
    success: true,
    message: smsText,
    sid: twilioMessage.sid,
  };
}
