import Anthropic from "@anthropic-ai/sdk";
import { apiConfig, companyConfig } from "@/lib/config";

// ─────────────────────────────────────────────────────────────
//  Agent 6: Site Health Monitor
//  Triggered: weekly cron (Sundays) or manual from dashboard
//  What it does:
//    1. Fetches Google PageSpeed Insights for the company website
//    2. Uses Claude to analyze results and give actionable fixes
//    3. Returns structured report with scores and recommendations
//  Replaces: manual PageSpeed checks, Brand24 monitoring ($79/mo)
// ─────────────────────────────────────────────────────────────

export interface SiteHealthReport {
  url: string;
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  loadTime: string;
  issues: { severity: "critical" | "warning" | "info"; description: string }[];
  recommendations: string[];
  summary: string;
  generatedAt: string;
}

async function fetchPageSpeedData(url: string): Promise<Record<string, unknown> | null> {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&category=accessibility&category=best-practices&category=seo&strategy=mobile`;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function extractScores(data: Record<string, unknown>): SiteHealthReport["scores"] {
  const categories = (data as { lighthouseResult?: { categories?: Record<string, { score?: number }> } })
    ?.lighthouseResult?.categories;

  return {
    performance: Math.round((categories?.performance?.score || 0) * 100),
    accessibility: Math.round((categories?.accessibility?.score || 0) * 100),
    bestPractices: Math.round((categories?.["best-practices"]?.score || 0) * 100),
    seo: Math.round((categories?.seo?.score || 0) * 100),
  };
}

function extractIssues(data: Record<string, unknown>): SiteHealthReport["issues"] {
  const audits = (data as { lighthouseResult?: { audits?: Record<string, { score?: number | null; title?: string; description?: string }> } })
    ?.lighthouseResult?.audits;
  if (!audits) return [];

  const issues: SiteHealthReport["issues"] = [];

  for (const [, audit] of Object.entries(audits)) {
    if (audit.score === 0) {
      issues.push({ severity: "critical", description: audit.title || "Unknown issue" });
    } else if (audit.score !== null && audit.score !== undefined && audit.score < 0.5) {
      issues.push({ severity: "warning", description: audit.title || "Unknown issue" });
    }
  }

  return issues.slice(0, 10); // Top 10 issues
}

export async function generateSiteHealthReport(
  websiteUrl?: string
): Promise<SiteHealthReport> {
  const url = websiteUrl || process.env.COMPANY_WEBSITE || `https://${companyConfig.name.toLowerCase().replace(/\s+/g, "")}.com`;

  const pageSpeedData = await fetchPageSpeedData(url);

  let scores: SiteHealthReport["scores"];
  let issues: SiteHealthReport["issues"];
  let loadTime = "Unknown";

  if (pageSpeedData) {
    scores = extractScores(pageSpeedData);
    issues = extractIssues(pageSpeedData);

    const timing = (pageSpeedData as { lighthouseResult?: { audits?: { "speed-index"?: { displayValue?: string } } } })
      ?.lighthouseResult?.audits?.["speed-index"]?.displayValue;
    loadTime = timing || "Unknown";
  } else {
    // Fallback if PageSpeed API fails
    scores = { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 };
    issues = [{ severity: "warning", description: "Could not reach PageSpeed API — check the website URL" }];
  }

  // Use Claude to analyze and provide recommendations
  const anthropic = new Anthropic({ apiKey: apiConfig.anthropicApiKey });

  const prompt = `You are a web performance consultant for ${companyConfig.name}, a construction company in ${companyConfig.city}.

Website: ${url}
PageSpeed Scores (mobile):
- Performance: ${scores.performance}/100
- Accessibility: ${scores.accessibility}/100
- Best Practices: ${scores.bestPractices}/100
- SEO: ${scores.seo}/100
Load time: ${loadTime}

Top issues found:
${issues.map((i) => `- [${i.severity}] ${i.description}`).join("\n")}

Return valid JSON:
{
  "summary": "2-3 sentence plain-English summary of the site health. Be direct about what's good and what needs fixing. Mention how this affects getting leads.",
  "recommendations": ["Up to 5 specific, actionable fixes ordered by impact. Each should be one clear sentence a non-technical person can act on."]
}

Focus on things that affect whether potential customers will stay on the site and request a quote. Be practical, not technical.
Return ONLY the JSON.`;

  let summary = `Site health check for ${url} completed.`;
  let recommendations = ["Review your PageSpeed scores and address critical issues first."];

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    if (response.content[0].type === "text") {
      const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        summary = parsed.summary || summary;
        recommendations = parsed.recommendations || recommendations;
      }
    }
  } catch {
    // fallback to defaults
  }

  return {
    url,
    scores,
    loadTime,
    issues,
    recommendations,
    summary,
    generatedAt: new Date().toISOString(),
  };
}
