"use client";

import { useState } from "react";

interface AgentStatus {
  name: string;
  phase: number;
  status: "live" | "coming_soon";
  lastRun?: string;
  description: string;
  icon: string;
}

interface ReviewForm {
  customerName: string;
  customerPhone: string;
  projectType: string;
}

const agents: AgentStatus[] = [
  {
    name: "Review Requester",
    phase: 1,
    status: "live",
    description: "Sends personalized SMS after job completion",
    icon: "⭐",
  },
  {
    name: "Morning Briefing",
    phase: 1,
    status: "live",
    description: "Daily 7am summary of quotes, follow-ups & schedule",
    icon: "☀️",
  },
  {
    name: "Quote Follow-Up",
    phase: 3,
    status: "coming_soon",
    description: "Auto-drafts follow-ups for quotes >48h with no reply",
    icon: "📋",
  },
  {
    name: "Content Generator",
    phase: 2,
    status: "coming_soon",
    description: "Weekly blog post, 7 social captions, GBP post & newsletter",
    icon: "✍️",
  },
  {
    name: "Site Health Monitor",
    phase: 3,
    status: "coming_soon",
    description: "PageSpeed, broken links, Core Web Vitals weekly report",
    icon: "🔍",
  },
  {
    name: "Competitor Watcher",
    phase: 4,
    status: "coming_soon",
    description: "Tracks competitor Google review changes & site updates",
    icon: "👁️",
  },
  {
    name: "Seasonal Campaigner",
    phase: 4,
    status: "coming_soon",
    description: "Monthly seasonal campaign drafts based on time of year",
    icon: "📅",
  },
];

export default function Dashboard() {
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    customerName: "",
    customerPhone: "",
    projectType: "",
  });
  const [reviewResult, setReviewResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [sendingReview, setSendingReview] = useState(false);

  const [briefing, setBriefing] = useState<{
    summary?: string;
    priorities?: string[];
    pendingQuotes?: number;
    overdueFollowUps?: number;
    newReviews?: number;
    todayJobs?: string[];
  } | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  const sendReviewRequest = async () => {
    if (!reviewForm.customerName || !reviewForm.customerPhone || !reviewForm.projectType) {
      setReviewResult({ error: "Please fill in all fields" });
      return;
    }
    setSendingReview(true);
    setReviewResult(null);
    try {
      const res = await fetch("/api/agents/review-requester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const data = await res.json();
      if (data.success) {
        setReviewResult({ success: true, message: data.messageSent });
        setReviewForm({ customerName: "", customerPhone: "", projectType: "" });
      } else {
        setReviewResult({ error: data.error || "Something went wrong" });
      }
    } catch {
      setReviewResult({ error: "Network error — please try again" });
    } finally {
      setSendingReview(false);
    }
  };

  const loadBriefing = async () => {
    setLoadingBriefing(true);
    setBriefing(null);
    try {
      const res = await fetch("/api/agents/morning-briefing");
      const data = await res.json();
      setBriefing(data);
    } catch {
      setBriefing(null);
    } finally {
      setLoadingBriefing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Command Center</h1>
            <p className="text-xs text-gray-400 mt-0.5">Pro Touch Construction · Burnaby, BC</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs text-gray-400">All systems operational</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Morning Briefing */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              ☀️ Morning Briefing
            </h2>
            <button
              onClick={loadBriefing}
              disabled={loadingBriefing}
              className="text-xs px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors disabled:opacity-50"
            >
              {loadingBriefing ? "Generating..." : "Refresh Briefing"}
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
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">
                    Today&apos;s Priorities
                  </p>
                  <ol className="space-y-1.5">
                    {briefing.priorities.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-xs bg-gray-700 text-gray-400 rounded px-1.5 py-0.5 mt-0.5 shrink-0">
                          {i + 1}
                        </span>
                        {p}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={loadBriefing}
              className="bg-gray-900 rounded-xl border border-gray-800 border-dashed p-8 text-center cursor-pointer hover:border-gray-600 transition-colors"
            >
              <p className="text-gray-500 text-sm">
                {loadingBriefing ? "Generating your briefing..." : "Click Refresh Briefing to generate today's summary"}
              </p>
            </div>
          )}
        </section>

        {/* Review Requester */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            ⭐ Send Review Request
          </h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-xs text-gray-400 mb-4">
              Enter job details — Claude will write a personalized SMS and send it via Twilio.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="Sarah Johnson"
                  value={reviewForm.customerName}
                  onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Customer Phone</label>
                <input
                  type="tel"
                  placeholder="+16045551234"
                  value={reviewForm.customerPhone}
                  onChange={(e) => setReviewForm({ ...reviewForm, customerPhone: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Project Type</label>
                <input
                  type="text"
                  placeholder="deck build, fence, renovation..."
                  value={reviewForm.projectType}
                  onChange={(e) => setReviewForm({ ...reviewForm, projectType: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={sendReviewRequest}
              disabled={sendingReview}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingReview ? "Sending..." : "Send Review Request"}
            </button>

            {reviewResult && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm ${
                  reviewResult.success
                    ? "bg-green-900/30 border border-green-800 text-green-300"
                    : "bg-red-900/30 border border-red-800 text-red-300"
                }`}
              >
                {reviewResult.success ? (
                  <>
                    <p className="font-medium mb-1">✅ SMS sent successfully</p>
                    <p className="text-xs text-green-400 font-mono bg-green-900/30 p-2 rounded">
                      {reviewResult.message}
                    </p>
                  </>
                ) : (
                  <p>❌ {reviewResult.error}</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Agent Status Grid */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            🤖 Agent Status
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className={`bg-gray-900 rounded-xl border p-4 ${
                  agent.status === "live"
                    ? "border-gray-700"
                    : "border-gray-800 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-lg">{agent.icon}</span>
                  <div className="flex items-center gap-1.5">
                    {agent.status === "live" ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        <span className="text-xs text-green-400">Live</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-gray-500">Phase {agent.phase}</span>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-medium text-white mb-1">{agent.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{agent.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cost Summary */}
        <section>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
              💰 Monthly Cost vs. Savings
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 mb-2">What this replaces</p>
                {[
                  { tool: "NiceJob (reviews)", cost: "$75" },
                  { tool: "Jasper/Copy.ai (content)", cost: "$69" },
                  { tool: "Brand24 (monitoring)", cost: "$79" },
                  { tool: "AI CMO tools", cost: "$99" },
                ].map((item) => (
                  <div key={item.tool} className="flex justify-between text-sm py-1.5 border-b border-gray-800">
                    <span className="text-gray-400 line-through">{item.tool}</span>
                    <span className="text-red-400">{item.cost}/mo</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-300 font-medium">Total replaced</span>
                  <span className="text-red-300 font-bold">$322/mo</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Your actual cost</p>
                {[
                  { tool: "Claude API (Haiku)", cost: "$8–15" },
                  { tool: "Twilio SMS", cost: "$3–5" },
                  { tool: "Vercel hosting", cost: "$0" },
                  { tool: "SendGrid (email)", cost: "$0" },
                ].map((item) => (
                  <div key={item.tool} className="flex justify-between text-sm py-1.5 border-b border-gray-800">
                    <span className="text-gray-400">{item.tool}</span>
                    <span className="text-green-400">{item.cost}/mo</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-gray-300 font-medium">Your total</span>
                  <span className="text-green-300 font-bold">~$15/mo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
