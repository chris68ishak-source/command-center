import Anthropic from "@anthropic-ai/sdk";
import { apiConfig, companyConfig } from "@/lib/config";

// ─────────────────────────────────────────────────────────────
//  Agent 8: Seasonal Campaigner
//  Triggered: 1st of each month via cron or manual from dashboard
//  What it does:
//    1. Determines current season and upcoming opportunities
//    2. Uses Claude to draft a full campaign: ad copy, email, social, offer
//    3. Returns a complete seasonal marketing campaign kit
//  Replaces: AI CMO tools ($99/mo)
// ─────────────────────────────────────────────────────────────

export interface SeasonalCampaign {
  month: string;
  theme: string;
  headline: string;
  offer: string;
  adCopy: {
    google: string;
    facebook: string;
    instagram: string;
  };
  emailDraft: {
    subject: string;
    body: string;
  };
  flyerText: string;
  talkingPoints: string[];
  summary: string;
  generatedAt: string;
}

function getMonthContext(): { month: string; season: string; context: string } {
  const now = new Date();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const month = monthNames[now.getMonth()];

  const seasonMap: Record<number, { season: string; context: string }> = {
    0: { season: "Winter", context: "New Year resolutions, winter storm damage repairs, indoor renovation planning. BC rain season — push indoor projects." },
    1: { season: "Late Winter", context: "Valentine's home refresh, early spring booking. Smart homeowners book now before the rush." },
    2: { season: "Early Spring", context: "Spring renovation season starting. Deck and fence quotes picking up. Best time to book before summer backlog." },
    3: { season: "Spring", context: "Peak booking season. Outdoor living spaces, deck builds, fence installs. Burnaby homeowners getting outside." },
    4: { season: "Late Spring", context: "Deck season in full swing. Summer entertaining prep. Last chance to book for summer completion." },
    5: { season: "Early Summer", context: "Peak construction season. Outdoor kitchens, patios, fences. Hot market — urgency messaging works." },
    6: { season: "Summer", context: "Mid-summer projects. Backyard makeovers, second-half bookings. Some contractors booked out — highlight availability." },
    7: { season: "Late Summer", context: "Back-to-school home upgrades. End of summer deck/fence deals. Fall booking starting." },
    8: { season: "Early Fall", context: "Fall renovation season round 2. Weatherproofing, deck sealing, fence repairs before winter." },
    9: { season: "Fall", context: "Pre-winter repairs critical in BC. Rain is coming — waterproofing, drainage, covered structures." },
    10: { season: "Late Fall", context: "Winter-proofing, indoor remodels, holiday entertaining spaces. Gift card promotions for home projects." },
    11: { season: "Winter", context: "Year-end projects, holiday entertaining prep. New Year planning. Gift certificates for spring projects." },
  };

  const { season, context } = seasonMap[now.getMonth()];
  return { month, season, context };
}

export async function generateSeasonalCampaign(): Promise<SeasonalCampaign> {
  const anthropic = new Anthropic({ apiKey: apiConfig.anthropicApiKey });
  const { month, season, context } = getMonthContext();

  const prompt = `You are a marketing strategist for ${companyConfig.name}, a construction and renovation company in ${companyConfig.city} specializing in ${companyConfig.services.join(", ")}.
Owner: ${companyConfig.ownerName}

Current month: ${month} (${season})
Seasonal context: ${context}

Create a complete seasonal marketing campaign. Return valid JSON:
{
  "theme": "Short campaign theme name (3-5 words)",
  "headline": "Punchy campaign headline (under 10 words)",
  "offer": "A specific, compelling seasonal offer (e.g. '15% off deck builds booked before April 15' or 'Free design consultation for spring projects')",
  "adCopy": {
    "google": "Google Ads copy: 2 headlines (30 chars each) + 1 description (90 chars). Format: Headline 1 | Headline 2 | Description",
    "facebook": "Facebook ad copy: 3-4 sentences. Conversational, local feel. Include the offer and a CTA.",
    "instagram": "Instagram caption: 2-3 sentences + relevant hashtags. Visual-first — describe what photo/video to pair with it."
  },
  "emailDraft": {
    "subject": "Email subject line (under 50 chars, high open rate style)",
    "body": "Full email body, 150-200 words. Personal from ${companyConfig.ownerName}. Mention the season, the offer, and end with a clear CTA to book a consultation."
  },
  "flyerText": "Door-knocker flyer text: headline + 3 bullet points + offer + phone number placeholder. Keep it scannable in 5 seconds.",
  "talkingPoints": ["5 things ${companyConfig.ownerName} can say when cold-calling or meeting potential customers this month. Natural, not salesy."],
  "summary": "2-3 sentence overview of the campaign strategy and why it works for ${month} in ${companyConfig.city}."
}

Make everything feel local to Burnaby/Vancouver. Reference real seasonal factors (BC weather, local events, etc.).
Return ONLY the JSON.`;

  const defaultCampaign: SeasonalCampaign = {
    month,
    theme: `${season} Home Improvement`,
    headline: `${season} Special from ${companyConfig.name}`,
    offer: "Free consultation on all projects this month",
    adCopy: {
      google: `${companyConfig.city} Renovations | Book Your ${season} Project | Free consultation — call today`,
      facebook: `${season} is the perfect time for that project you've been thinking about. ${companyConfig.name} is booking now. Free consultations this month!`,
      instagram: `${season} vibes and new builds. What's your dream project? DM us! #${companyConfig.city.split(",")[0].replace(/\s/g, "")} #renovation`,
    },
    emailDraft: {
      subject: `Your ${season} home project starts here`,
      body: `Hi there, ${companyConfig.ownerName} here from ${companyConfig.name}. ${season} is a great time to tackle that project. Reach out for a free consultation!`,
    },
    flyerText: `${companyConfig.name}\n${season} SPECIAL\nFree Consultation\nCall: ${companyConfig.phone}`,
    talkingPoints: ["Mention the seasonal timing", "Reference local weather patterns", "Offer a free quote"],
    summary: `${season} campaign for ${companyConfig.name} focused on seasonal demand in ${companyConfig.city}.`,
    generatedAt: new Date().toISOString(),
  };

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    if (response.content[0].type === "text") {
      const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          month,
          theme: parsed.theme || defaultCampaign.theme,
          headline: parsed.headline || defaultCampaign.headline,
          offer: parsed.offer || defaultCampaign.offer,
          adCopy: parsed.adCopy || defaultCampaign.adCopy,
          emailDraft: parsed.emailDraft || defaultCampaign.emailDraft,
          flyerText: parsed.flyerText || defaultCampaign.flyerText,
          talkingPoints: parsed.talkingPoints || defaultCampaign.talkingPoints,
          summary: parsed.summary || defaultCampaign.summary,
          generatedAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    // fallback
  }

  return defaultCampaign;
}
