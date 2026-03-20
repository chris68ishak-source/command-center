import Anthropic from "@anthropic-ai/sdk";
import { apiConfig, companyConfig } from "@/lib/config";

// ─────────────────────────────────────────────────────────────
//  Agent 5: Content Generator
//  Triggered: weekly cron or manual from dashboard
//  What it does:
//    1. Uses Claude to generate a full week of marketing content
//    2. Returns: blog post, 7 social captions, GBP post, newsletter blurb
//  Replaces: Jasper/Copy.ai ($69/mo)
// ─────────────────────────────────────────────────────────────

export interface GeneratedContent {
  blogPost: {
    title: string;
    body: string;
    metaDescription: string;
  };
  socialCaptions: {
    day: string;
    platform: string;
    caption: string;
    hashtags: string[];
  }[];
  googleBusinessPost: string;
  newsletterBlurb: string;
  generatedAt: string;
  topic: string;
}

function getSeasonalContext(): string {
  const month = new Date().getMonth();
  const seasons: Record<number, string> = {
    0: "New year home improvement resolutions, winter maintenance",
    1: "Valentine's/home refresh, pre-spring planning",
    2: "Spring renovation season starting, deck and fence planning",
    3: "Peak spring — outdoor living spaces, deck builds",
    4: "Deck season in full swing, outdoor entertaining prep",
    5: "Summer projects, fence installs, outdoor kitchens",
    6: "Mid-summer projects, backyard makeovers",
    7: "Back-to-school home upgrades, end of summer decks",
    8: "Fall prep, weatherproofing, renovation season round 2",
    9: "Pre-winter repairs, indoor renovations",
    10: "Winter-proofing, indoor remodels, holiday prep",
    11: "Year-end projects, holiday entertaining spaces",
  };
  return seasons[month] || "general home improvement";
}

export async function generateWeeklyContent(
  topic?: string
): Promise<GeneratedContent> {
  const anthropic = new Anthropic({ apiKey: apiConfig.anthropicApiKey });

  const seasonalContext = getSeasonalContext();
  const contentTopic =
    topic ||
    `seasonal content for ${companyConfig.city} area: ${seasonalContext}`;

  const prompt = `You are a marketing content strategist for ${companyConfig.name}, a construction and renovation company in ${companyConfig.city}.
They specialize in: ${companyConfig.services.join(", ")}.
Owner: ${companyConfig.ownerName}

Generate a full week of marketing content about: ${contentTopic}

Return valid JSON with this exact structure:
{
  "blogPost": {
    "title": "SEO-friendly title (60 chars max)",
    "body": "400-500 word blog post. Professional but approachable. Include practical tips homeowners can use. Naturally mention ${companyConfig.name} and ${companyConfig.city}.",
    "metaDescription": "155 character meta description for SEO"
  },
  "socialCaptions": [
    {"day": "Monday", "platform": "Instagram", "caption": "Engaging caption with CTA", "hashtags": ["relevant", "local", "industry"]},
    {"day": "Tuesday", "platform": "Facebook", "caption": "...", "hashtags": []},
    {"day": "Wednesday", "platform": "Instagram", "caption": "...", "hashtags": []},
    {"day": "Thursday", "platform": "Facebook", "caption": "...", "hashtags": []},
    {"day": "Friday", "platform": "Instagram", "caption": "Before/after or tip post", "hashtags": []},
    {"day": "Saturday", "platform": "Facebook", "caption": "Weekend project inspiration", "hashtags": []},
    {"day": "Sunday", "platform": "Instagram", "caption": "Community/lifestyle post", "hashtags": []}
  ],
  "googleBusinessPost": "Short Google Business Profile update (150 words max). Include a call to action.",
  "newsletterBlurb": "Email newsletter section (100-150 words). Warm, personal tone from ${companyConfig.ownerName}. Include one specific tip and a CTA to book a consultation."
}

Make all content:
- Authentic and local (mention ${companyConfig.city} area naturally)
- Practical — real tips people can use
- Not salesy — educational with soft CTAs
- SEO-aware for the blog post
- Varied in tone across the week

Return ONLY the JSON, no other text.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  // Default fallback content
  const defaultContent: GeneratedContent = {
    blogPost: {
      title: `Home Improvement Tips for ${companyConfig.city} Homeowners`,
      body: "Content generation in progress...",
      metaDescription: `Expert renovation tips from ${companyConfig.name} in ${companyConfig.city}.`,
    },
    socialCaptions: [
      {
        day: "Monday",
        platform: "Instagram",
        caption: "Starting the week with a fresh project!",
        hashtags: ["renovation", companyConfig.city.split(",")[0].toLowerCase().trim()],
      },
    ],
    googleBusinessPost: `${companyConfig.name} is booking new projects this season. Contact us for a free consultation!`,
    newsletterBlurb: `Hey there, ${companyConfig.ownerName} here. Exciting projects happening this month — reach out if you have something in mind!`,
    generatedAt: new Date().toISOString(),
    topic: contentTopic,
  };

  if (response.content[0].type === "text") {
    try {
      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          blogPost: parsed.blogPost || defaultContent.blogPost,
          socialCaptions: parsed.socialCaptions || defaultContent.socialCaptions,
          googleBusinessPost:
            parsed.googleBusinessPost || defaultContent.googleBusinessPost,
          newsletterBlurb:
            parsed.newsletterBlurb || defaultContent.newsletterBlurb,
          generatedAt: new Date().toISOString(),
          topic: contentTopic,
        };
      }
    } catch {
      // fallback to defaults
    }
  }

  return defaultContent;
}
