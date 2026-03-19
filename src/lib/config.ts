import { CompanyConfig } from "@/types";

// ─────────────────────────────────────────────────────────────
//  Company Config — edit this per client deployment
//  When selling to new companies: just change these values
//  and redeploy with their env vars.
// ─────────────────────────────────────────────────────────────
export const companyConfig: CompanyConfig = {
  name: process.env.COMPANY_NAME || "Pro Touch Construction",
  phone: process.env.COMPANY_PHONE || "+16045550000",
  googleReviewLink:
    process.env.GOOGLE_REVIEW_LINK ||
    "https://g.page/r/YOUR_GOOGLE_PLACE_ID/review",
  city: process.env.COMPANY_CITY || "Burnaby, BC",
  services: (process.env.COMPANY_SERVICES || "decks,fences,renovations").split(
    ","
  ),
  ownerName: process.env.OWNER_NAME || "Chris",
};

export const apiConfig = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || "",
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER || "",
  cronSecret: process.env.CRON_SECRET || "dev-secret",
};
