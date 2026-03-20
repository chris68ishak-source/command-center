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

interface FollowUpForm {
  customerName: string;
  customerPhone: string;
  quoteAmount: string;
  projectType: string;
  sentAt: string;
}

interface ContentResult {
  blogPost?: { title: string; body: string; metaDescription: string };
  socialCaptions?: { day: string; platform: string; caption: string; hashtags: string[] }[];
  googleBusinessPost?: string;
  newsletterBlurb?: string;
  topic?: string;
}

const agents: AgentStatus[] = [
  {
    name: "Morning Briefing",
    phase: 1,
    status: "live",
    description: "Daily 7am summary of quotes, follow-ups & schedule",
    icon: "☀️",
  },
  {
    name: "Review Requester",
    phase: 1,
    status: "live",
    description: "Sends personalized SMS after job completion",
    icon: "⭐",
  },
  {
    name: "Quote Follow-Up",
    phase: 2,
    status: "live",
    description: "AI follow-up SMS for quotes with no reply",
    icon: "📋",
  },
  {
    name: "Content Generator",
    phase: 2,
    status: "live",
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
  // Review Request state
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

  // Morning Briefing state
  const [briefing, setBriefing] = useState<{
    summary?: string;
    priorities?: string[];
    pendingQuotes?: number;
    overdueFollowUps?: number;
    newReviews?: number;
    todayJobs?: string[];
  } | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  // Quote Follow-Up state
  const [followUpForm, setFollowUpForm] = useState<FollowUpForm>({
    customerName: "",
    customerPhone: "",
    quoteAmount: "",
    projectType: "",
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
  const [followUpResult, setFollowUpResult] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  } | null>(null);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);

  // Content Generator state
  const [contentTopic, setContentTopic] = useState("");
  const [contentResult, setContentResult] = useState<ContentResult | null>(null);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<"blog" | "social" | "gbp" | "newsletter">("blog");

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

  const sendFollowUp = async () => {
    if (!followUpForm.customerName || !followUpForm.customerPhone || !followUpForm.quoteAmount || !followUpForm.projectType) {
      setFollowUpResult({ error: "Please fill in all fields" });
      return;
    }
    setSendingFollowUp(true);
    setFollowUpResult(null);
    try {
      const res = await fetch("/api/agents/quote-follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...followUpForm,
          quoteAmount: parseFloat(followUpForm.quoteAmount),
          sentAt: new Date(followUpForm.sentAt).toISOString(),
          jobId: `Q-${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFollowUpResult({ success: true, message: data.messageSent });
        setFollowUpForm({
          customerName: "",
          customerPhone: "",
          quoteAmount: "",
          projectType: "",
          sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        });
      } else {
        setFollowUpResult({ error: data.error || "Something went wrong" });
      }
    } catch {
      setFollowUpResult({ error: "Network error — please try again" });
    } finally {
      setSendingFollowUp(false);
    }
  };

  const generateContent = async () => {
    setGeneratingContent(true);
    setContentResult(null);
    try {
      const res = await fetch("/api/agents/content-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: contentTopic || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setContentResult(data.content);
        setActiveContentTab("blog");
      }
    } catch {
      // silent fail
    } finally {
      setGeneratingContent(false);
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
            <span className="text-xs text-gray-400">4 agents live</span>
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

        {/* Quote Follow-Up */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            📋 Quote Follow-Up
          </h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-xs text-gray-400 mb-4">
              Enter a quote that hasn&apos;t gotten a reply — Claude will craft a natural follow-up SMS.
            </p>
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="Mike Chen"
                  value={followUpForm.customerName}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, customerName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="+16045551234"
                  value={followUpForm.customerPhone}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, customerPhone: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Quote Amount</label>
                <input
                  type="number"
                  placeholder="4500"
                  value={followUpForm.quoteAmount}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, quoteAmount: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Project Type</label>
                <input
                  type="text"
                  placeholder="fence install"
                  value={followUpForm.projectType}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, projectType: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Quote Sent</label>
                <input
                  type="date"
                  value={followUpForm.sentAt}
                  onChange={(e) => setFollowUpForm({ ...followUpForm, sentAt: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              onClick={sendFollowUp}
              disabled={sendingFollowUp}
              className="bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingFollowUp ? "Sending..." : "Send Follow-Up"}
            </button>

            {followUpResult && (
              <div
                className={`mt-4 p-3 rounded-lg text-sm ${
                  followUpResult.success
                    ? "bg-green-900/30 border border-green-800 text-green-300"
                    : "bg-red-900/30 border border-red-800 text-red-300"
                }`}
              >
                {followUpResult.success ? (
                  <>
                    <p className="font-medium mb-1">✅ Follow-up sent</p>
                    <p className="text-xs text-green-400 font-mono bg-green-900/30 p-2 rounded">
                      {followUpResult.message}
                    </p>
                  </>
                ) : (
                  <p>❌ {followUpResult.error}</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Content Generator */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            ✍️ Content Generator
          </h2>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-xs text-gray-400 mb-4">
              Generate a full week of content — blog post, 7 social captions, Google Business post, and newsletter blurb.
            </p>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Custom topic (leave empty for seasonal auto-pick)"
                value={contentTopic}
                onChange={(e) => setContentTopic(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                onClick={generateContent}
                disabled={generatingContent}
                className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {generatingContent ? "Generating..." : "Generate Week"}
              </button>
            </div>

            {contentResult && (
              <div className="space-y-4">
                {/* Content Tabs */}
                <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                  {[
                    { key: "blog" as const, label: "Blog Post" },
                    { key: "social" as const, label: "Social (7 days)" },
                    { key: "gbp" as const, label: "Google Business" },
                    { key: "newsletter" as const, label: "Newsletter" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveContentTab(tab.key)}
                      className={`flex-1 text-xs py-2 px-3 rounded-md transition-colors ${
                        activeContentTab === tab.key
                          ? "bg-purple-600 text-white"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Blog Post */}
                {activeContentTab === "blog" && contentResult.blogPost && (
                  <div className="space-y-3">
                    <h3 className="text-white font-medium text-sm">{contentResult.blogPost.title}</h3>
                    <p className="text-xs text-purple-400 italic">{contentResult.blogPost.metaDescription}</p>
                    <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto bg-gray-800/50 rounded-lg p-4">
                      {contentResult.blogPost.body}
                    </div>
                  </div>
                )}

                {/* Social Captions */}
                {activeContentTab === "social" && contentResult.socialCaptions && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {contentResult.socialCaptions.map((post, i) => (
                      <div key={i} className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-purple-400">{post.day}</span>
                          <span className="text-xs text-gray-500">·</span>
                          <span className="text-xs text-gray-400">{post.platform}</span>
                        </div>
                        <p className="text-sm text-gray-300">{post.caption}</p>
                        {post.hashtags.length > 0 && (
                          <p className="text-xs text-blue-400 mt-1">
                            {post.hashtags.map((h) => `#${h}`).join(" ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Google Business Post */}
                {activeContentTab === "gbp" && contentResult.googleBusinessPost && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {contentResult.googleBusinessPost}
                    </p>
                  </div>
                )}

                {/* Newsletter */}
                {activeContentTab === "newsletter" && contentResult.newsletterBlurb && (
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {contentResult.newsletterBlurb}
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-600">
                  Topic: {contentResult.topic} · Copy any text above and paste into your platforms
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Agent Status Grid */}
        <section>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
            🤖 Agent Status
          </h2>
          <div className="grid grid-cols-4 gap-3">
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
