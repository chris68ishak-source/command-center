"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";

interface SiteHealthResult {
  url?: string;
  scores?: { performance: number; accessibility: number; bestPractices: number; seo: number };
  loadTime?: string;
  issues?: { severity: string; description: string }[];
  recommendations?: string[];
  summary?: string;
}

interface CompetitorResult {
  competitors?: string[];
  insights?: { competitor: string; analysis: string }[];
  opportunities?: string[];
  threats?: string[];
  actionItems?: string[];
  summary?: string;
}

export default function IntelPage() {
  const [siteUrl, setSiteUrl] = useState("");
  const [siteHealth, setSiteHealth] = useState<SiteHealthResult | null>(null);
  const [loadingSite, setLoadingSite] = useState(false);

  const [competitorNames, setCompetitorNames] = useState("");
  const [competitor, setCompetitor] = useState<CompetitorResult | null>(null);
  const [loadingCompetitor, setLoadingCompetitor] = useState(false);

  const scoreColor = (s: number) => s >= 90 ? "text-green-400" : s >= 50 ? "text-yellow-400" : "text-red-400";

  const runSiteHealth = async () => {
    setLoadingSite(true); setSiteHealth(null);
    try {
      const res = await fetch("/api/agents/site-health", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: siteUrl || undefined }) });
      const data = await res.json();
      if (data.success) setSiteHealth(data.report);
    } catch { /* silent */ }
    finally { setLoadingSite(false); }
  };

  const runCompetitor = async () => {
    setLoadingCompetitor(true); setCompetitor(null);
    try {
      const competitors = competitorNames ? competitorNames.split(",").map((c) => c.trim()).filter(Boolean) : undefined;
      const res = await fetch("/api/agents/competitor-watcher", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ competitors }) });
      const data = await res.json();
      if (data.success) setCompetitor(data.report);
    } catch { /* silent */ }
    finally { setLoadingCompetitor(false); }
  };

  return (
    <div>
      <PageHeader icon="👁️" title="Intel" description="Site health audits and competitive intelligence" />
      <div className="px-8 py-6 space-y-8">

        {/* Site Health */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">🔍 Site Health Monitor</h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-xs text-gray-400 mb-4">Run a PageSpeed audit with AI-powered fix recommendations.</p>
            <div className="flex gap-3 mb-4">
              <input type="url" placeholder="https://yourwebsite.com (leave empty for default)" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors" />
              <button onClick={runSiteHealth} disabled={loadingSite} className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap">
                {loadingSite ? "Scanning..." : "Run Audit"}
              </button>
            </div>
            {siteHealth && (
              <div className="space-y-4">
                <p className="text-sm text-gray-200 leading-relaxed">{siteHealth.summary}</p>
                {siteHealth.scores && (
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Performance", value: siteHealth.scores.performance },
                      { label: "Accessibility", value: siteHealth.scores.accessibility },
                      { label: "Best Practices", value: siteHealth.scores.bestPractices },
                      { label: "SEO", value: siteHealth.scores.seo },
                    ].map((s) => (
                      <div key={s.label} className="bg-gray-800 rounded-lg p-3 text-center">
                        <div className={`text-2xl font-bold ${scoreColor(s.value)}`}>{s.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                {siteHealth.recommendations && siteHealth.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Recommended Fixes</p>
                    <ol className="space-y-1.5">
                      {siteHealth.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-xs bg-cyan-900/50 text-cyan-400 rounded px-1.5 py-0.5 mt-0.5 shrink-0">{i + 1}</span>{r}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Competitor Watcher */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">👁️ Competitor Watcher</h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-xs text-gray-400 mb-4">Get competitive analysis with opportunities, threats, and weekly action items.</p>
            <div className="flex gap-3 mb-4">
              <input type="text" placeholder="Competitor names, comma-separated (leave empty for defaults)" value={competitorNames} onChange={(e) => setCompetitorNames(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors" />
              <button onClick={runCompetitor} disabled={loadingCompetitor} className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap">
                {loadingCompetitor ? "Analyzing..." : "Run Analysis"}
              </button>
            </div>
            {competitor && (
              <div className="space-y-4">
                <p className="text-sm text-gray-200 leading-relaxed">{competitor.summary}</p>
                {competitor.insights && competitor.insights.length > 0 && (
                  <div className="space-y-2">
                    {competitor.insights.map((ins, i) => (
                      <div key={i} className="bg-gray-800/50 rounded-lg p-3">
                        <p className="text-xs font-medium text-amber-400 mb-1">{ins.competitor}</p>
                        <p className="text-sm text-gray-300">{ins.analysis}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-green-400 uppercase tracking-wider mb-2 font-semibold">Opportunities</p>
                    {competitor.opportunities?.map((o, i) => (<p key={i} className="text-sm text-gray-300 mb-1.5">• {o}</p>))}
                  </div>
                  <div>
                    <p className="text-xs text-red-400 uppercase tracking-wider mb-2 font-semibold">Threats</p>
                    {competitor.threats?.map((t, i) => (<p key={i} className="text-sm text-gray-300 mb-1.5">• {t}</p>))}
                  </div>
                  <div>
                    <p className="text-xs text-amber-400 uppercase tracking-wider mb-2 font-semibold">This Week</p>
                    {competitor.actionItems?.map((a, i) => (<p key={i} className="text-sm text-gray-300 mb-1.5">• {a}</p>))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
