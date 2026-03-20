import Anthropic from "@anthropic-ai/sdk";
import { apiConfig, companyConfig } from "@/lib/config";

// ─────────────────────────────────────────────────────────────
//  Agent 7: Competitor Watcher
//  Triggered: weekly cron or manual from dashboard
//  What it does:
//    1. Takes a list of competitor business names
//    2. Uses Claude to analyze competitive positioning
//    3. Returns insights on reviews, pricing signals, and opportunities
//  Replaces: Brand24 ($79/mo), manual competitor stalking
// ─────────────────────────────────────────────────────────────

export interface CompetitorInsight {
  competitor: string;
  analysis: string;
}

export interface CompetitorReport {
  competitors: string[];
  insights: CompetitorInsight[];
  opportunities: string[];
  threats: string[];
  actionItems: string[];
  summary: string;
  generatedAt: string;
}

function getDefaultCompetitors(): string[] {
  const envCompetitors = process.env.COMPETITOR_NAMES;
  if (envCompetitors) {
    return envCompetitors.split(",").map((c) => c.trim());
  }
  // Default competitors for a Burnaby construction company
  return [
    "Burnaby Decks & Fences",
    "Pacific West Renovations",
    "Metro Vancouver Builders",
  ];
}

export async function generateCompetitorReport(
  competitors?: string[]
): Promise<CompetitorReport> {
  const anthropic = new Anthropic({ apiKey: apiConfig.anthropicApiKey });
  const competitorList = competitors || getDefaultCompetitors();

  const prompt = `You are a competitive intelligence analyst for ${companyConfig.name}, a construction and renovation company in ${companyConfig.city} specializing in ${companyConfig.services.join(", ")}.

Their competitors are: ${competitorList.join(", ")}

Based on your knowledge of the construction industry in the Greater Vancouver / Burnaby area, provide a competitive analysis. Think about:
- What these types of companies typically compete on (price, quality, speed, reviews)
- Common strengths and weaknesses of local contractors
- Where ${companyConfig.name} could differentiate
- Seasonal factors in BC construction

Return valid JSON:
{
  "insights": [
    {"competitor": "Competitor Name", "analysis": "2-3 sentences about likely competitive position, strengths, weaknesses"}
  ],
  "opportunities": ["3 specific opportunities ${companyConfig.name} could exploit — be actionable"],
  "threats": ["2-3 competitive threats to watch out for"],
  "actionItems": ["3 specific things ${companyConfig.ownerName} should do this week to gain competitive advantage"],
  "summary": "3-4 sentence executive summary of the competitive landscape and ${companyConfig.name}'s position"
}

Be specific and practical. ${companyConfig.ownerName} is hands-on and wants things they can do TODAY.
Return ONLY the JSON.`;

  let insights: CompetitorInsight[] = competitorList.map((c) => ({
    competitor: c,
    analysis: "Analysis pending.",
  }));
  let opportunities = ["Analyze competitor reviews for common complaints you can address."];
  let threats = ["New competitors entering the market with aggressive pricing."];
  let actionItems = ["Check competitor Google reviews this week."];
  let summary = `Competitive analysis for ${companyConfig.name} against ${competitorList.length} competitors.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    if (response.content[0].type === "text") {
      const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        insights = parsed.insights || insights;
        opportunities = parsed.opportunities || opportunities;
        threats = parsed.threats || threats;
        actionItems = parsed.actionItems || actionItems;
        summary = parsed.summary || summary;
      }
    }
  } catch {
    // fallback to defaults
  }

  return {
    competitors: competitorList,
    insights,
    opportunities,
    threats,
    actionItems,
    summary,
    generatedAt: new Date().toISOString(),
  };
}
