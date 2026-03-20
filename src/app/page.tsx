"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";

const agents = [
  { name: "Morning Briefing", icon: "☀️", description: "Daily summary", page: "/", schedule: "Daily 7am" },
  { name: "Review Requester", icon: "⭐", description: "SMS review requests", page: "/reviews", schedule: "On demand" },
  { name: "Quote Tracker", icon: "📋", description: "Pipeline & follow-ups", page: "/quotes", schedule: "On demand" },
  { name: "Content Generator", icon: "✍️", description: "Weekly content", page: "/content", schedule: "Mondays" },
  { name: "Site Health", icon: "🔍", description: "PageSpeed audit", page: "/intel", schedule: "Sundays" },
  { name: "Competitor Watcher", icon: "👁️", description: "Competitive intel", page: "/intel", schedule: "Wednesdays" },
  { name: "Seasonal Campaigner", icon: "📅", description: "Campaign kit", page: "/campaign", schedule: "1st of month" },
];

export default function DashboardPage() {
  const [briefing, setBriefing] = useState<{
    summary?: string; priorities?: string[]; pendingQuotes?: number; overdueFollowUps?: number; newReviews?: number; todayJobs?: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const loadBriefing = async () => {
    setLoading(true); setBriefing(null);
    try { const res = await fetch("/api/agents/morning-briefing"); setBriefing(await res.json()); }
    catch { setBriefing(null); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader icon="☀️" title="Dashboard" description="Your morning briefing and agent overview" />
      <div className="px-8 py-6 space-y-8">

        {/* Morning Briefing */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Morning Briefing</h2>
            <button onClick={loadBriefing} disabled={loading} className="text-xs px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50">
              {loading ? "Generating..." : "Refresh Briefing"}
            </button>
          </div>
          {briefing ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
              <p className="text-gray-200 text-sm leading-relaxed">{briefing.summary}</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Pending Quotes", value: briefing.pendingQuotes, color: "text-yellow-400" },
                  { label: "Overdue Follow-ups", value: briefing.overdueFollowUps, color: "text-red-400" },
                  { label: "New Reviews", value: briefing.newReviews, color: "text-green-400" },
                  { label: "Jobs Today", value: briefing.todayJobs?.length, color: "text-blue-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
              {briefing.priorities && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Today&apos;s Priorities</p>
                  <ol className="space-y-1.5">
                    {briefing.priorities.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-xs bg-gray-700 text-gray-400 rounded px-1.5 py-0.5 mt-0.5 shrink-0">{i + 1}</span>{p}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div onClick={loadBriefing} className="bg-gray-900 rounded-xl border border-gray-800 border-dashed p-8 text-center cursor-pointer hover:border-gray-600 transition-colors">
              <p className="text-gray-500 text-sm">{loading ? "Generating your briefing..." : "Click Refresh Briefing to generate today's summary"}</p>
            </div>
          )}
        </section>

        {/* Agent Grid */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Agent Status</h2>
          <div className="grid grid-cols-4 gap-3">
            {agents.map((agent) => (
              <a key={agent.name} href={agent.page} className="bg-gray-900 rounded-xl border border-gray-700 p-4 hover:border-gray-600 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-lg">{agent.icon}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-white mb-0.5 group-hover:text-blue-400 transition-colors">{agent.name}</h3>
                <p className="text-xs text-gray-500">{agent.description}</p>
                <p className="text-[10px] text-gray-600 mt-2">{agent.schedule}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Cost Summary */}
        <section>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">💰 Monthly Cost vs. Savings</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-2">What this replaces</p>
                {[{ tool: "NiceJob (reviews)", cost: "$75" }, { tool: "Jasper/Copy.ai (content)", cost: "$69" }, { tool: "Brand24 (monitoring)", cost: "$79" }, { tool: "AI CMO tools", cost: "$99" }].map((item) => (
                  <div key={item.tool} className="flex justify-between text-sm py-1.5 border-b border-gray-800">
                    <span className="text-gray-400 line-through">{item.tool}</span><span className="text-red-400">{item.cost}/mo</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2"><span className="text-gray-300 font-medium">Total replaced</span><span className="text-red-300 font-bold">$322/mo</span></div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Your actual cost</p>
                {[{ tool: "Claude API (Haiku)", cost: "$8–15" }, { tool: "Twilio SMS", cost: "$3–5" }, { tool: "Vercel hosting", cost: "$0" }, { tool: "SendGrid (email)", cost: "$0" }].map((item) => (
                  <div key={item.tool} className="flex justify-between text-sm py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">{item.tool}</span><span className="text-green-400">{item.cost}/mo</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2"><span className="text-gray-300 font-medium">Your total</span><span className="text-green-300 font-bold">~$15/mo</span></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
