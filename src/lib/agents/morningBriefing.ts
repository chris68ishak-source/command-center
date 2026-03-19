import Anthropic from "@anthropic-ai/sdk";
import { apiConfig, companyConfig } from "@/lib/config";

// ─────────────────────────────────────────────────────────────
//  Agent 1: Morning Briefing
//  Runs: Daily at 7am via Vercel cron
//  What it does:
//    - Summarizes pending quotes, follow-ups, and priorities
//    - Returns a structured briefing for the dashboard
//  Phase 3 upgrade: pull live data from Jobber API
// ─────────────────────────────────────────────────────────────

export interface BriefingData {
  pendingQuotes: number;
  overdueFollowUps: number;
  newReviews: number;
  todayJobs: string[];
  summary: string;
  priorities: string[];
  generatedAt: string;
}

// In Phase 3, these will be fetched from Jobber / Google My Business APIs
function getMockBusinessData() {
  return {
    pendingQuotes: 3,
    overdueFollowUps: 1,
    newReviews: 2,
    todayJobs: ["Deck build — Johnson residence (9am)", "Fence repair — Martinez (2pm)"],
  };
}

export async function generateMorningBriefing(): Promise<BriefingData> {
  const anthropic = new Anthropic({ apiKey: apiConfig.anthropicApiKey });
  const data = getMockBusinessData();

  const prompt = `You are a business assistant for ${companyConfig.name}, a construction company in ${companyConfig.city}.

Current status:
- Pending quotes waiting for response: ${data.pendingQuotes}
- Overdue follow-ups (48h+ no response): ${data.overdueFollowUps}
- New Google reviews since yesterday: ${data.newReviews}
- Today's scheduled jobs: ${data.todayJobs.join(", ")}

Write a short, direct morning briefing for the owner ${companyConfig.ownerName}.
- 3-4 sentences max
- Start with the most urgent item
- Conversational, like a smart assistant talking to their boss
- No fluff or greetings

Then list exactly 3 priority actions for today, each one sentence.

Format your response as JSON:
{
  "summary": "...",
  "priorities": ["...", "...", "..."]
}`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{ role: "user", content: prompt }],
  });

  let summary = "Good morning! Here's your briefing.";
  let priorities = ["Check pending quotes", "Follow up on overdue leads", "Review today's schedule"];

  if (response.content[0].type === "text") {
    try {
      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = parsed.summary || summary;
        priorities = parsed.priorities || priorities;
      }
    } catch {
      // fallback to defaults
    }
  }

  return {
    ...data,
    summary,
    priorities,
    generatedAt: new Date().toISOString(),
  };
}
