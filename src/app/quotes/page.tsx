"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";

interface Quote {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  quote_amount: number;
  project_type: string;
  description?: string;
  status: string;
  sent_at: string;
  followed_up_at?: string;
  follow_up_message?: string;
  closed_at?: string;
}

interface QuoteStats {
  pending: string;
  followed_up: string;
  won: string;
  lost: string;
  pipeline_value: string;
  won_value: string;
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<QuoteStats | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", quoteAmount: "", projectType: "", description: "", sentAt: new Date().toISOString().split("T")[0] });
  const [sendingFollowUp, setSendingFollowUp] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadQuotes = useCallback(async () => {
    try {
      const [quotesRes, statsRes] = await Promise.all([
        fetch("/api/db/quotes"),
        fetch("/api/db/quotes?stats=true"),
      ]);
      const quotesData = await quotesRes.json();
      const statsData = await statsRes.json();
      if (quotesData.success && Array.isArray(quotesData.quotes)) setQuotes(quotesData.quotes);
      if (statsData.success && statsData.stats) setStats(statsData.stats);
    } catch (err) { console.error("Load quotes error:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  const addQuote = async () => {
    if (!form.customerName || !form.customerPhone || !form.quoteAmount || !form.projectType) return;
    try {
      const res = await fetch("/api/db/quotes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, quoteAmount: parseFloat(form.quoteAmount), sentAt: new Date(form.sentAt).toISOString() }),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ customerName: "", customerPhone: "", customerEmail: "", quoteAmount: "", projectType: "", description: "", sentAt: new Date().toISOString().split("T")[0] });
        setShowAddForm(false);
        loadQuotes();
      }
    } catch (err) { console.error("Add quote error:", err); }
  };

  const sendFollowUp = async (quote: Quote) => {
    setSendingFollowUp(quote.id);
    try {
      const res = await fetch("/api/agents/quote-follow-up", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: quote.customer_name, customerPhone: quote.customer_phone,
          quoteAmount: quote.quote_amount, projectType: quote.project_type,
          sentAt: quote.sent_at, jobId: `Q-${quote.id}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetch("/api/db/quotes", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "followUp", id: quote.id, message: data.messageSent, twilioSid: data.twilioSid }),
        });
        loadQuotes();
      }
    } catch (err) { console.error("Follow up error:", err); }
    finally { setSendingFollowUp(null); }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch("/api/db/quotes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStatus", id, status }),
      });
      const data = await res.json();
      if (data.success) {
        // If won, also create a job record
        if (status === "won") {
          const quote = quotes.find((q) => q.id === id);
          if (quote) {
            await fetch("/api/db/jobs", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                quoteId: quote.id, customerName: quote.customer_name, customerPhone: quote.customer_phone,
                customerEmail: quote.customer_email, projectType: quote.project_type,
                amount: quote.quote_amount, description: quote.description, status: "in_progress",
              }),
            });
          }
        }
        loadQuotes();
      }
    } catch (err) { console.error("Update status error:", err); }
  };

  const daysSince = (date: string) => {
    if (!date) return 0;
    const d = new Date(date).getTime();
    if (isNaN(d)) return 0;
    return Math.floor((Date.now() - d) / (1000 * 60 * 60 * 24));
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      case "followed_up": return "bg-blue-900/30 text-blue-400 border-blue-800";
      case "won": return "bg-green-900/30 text-green-400 border-green-800";
      case "lost": return "bg-red-900/30 text-red-400 border-red-800";
      default: return "bg-gray-900/30 text-gray-400 border-gray-800";
    }
  };

  return (
    <div>
      <PageHeader icon="📋" title="Quote Tracker" description="Track quotes, send AI follow-ups, and manage your pipeline" />
      <div className="px-8 py-6 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-3">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-xs text-gray-400 mt-1">Pending</div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.followed_up}</div>
              <div className="text-xs text-gray-400 mt-1">Followed Up</div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.won}</div>
              <div className="text-xs text-gray-400 mt-1">Won</div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.lost}</div>
              <div className="text-xs text-gray-400 mt-1">Lost</div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
              <div className="text-2xl font-bold text-white">${Number(stats.pipeline_value).toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">Pipeline Value</div>
            </div>
          </div>
        )}

        {/* Add Quote */}
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Pipeline</h2>
          <button onClick={() => setShowAddForm(!showAddForm)} className="text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors">
            {showAddForm ? "Cancel" : "+ Add Quote"}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Customer Name *</label>
                <input type="text" placeholder="Sarah Johnson" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Phone *</label>
                <input type="tel" placeholder="+16045551234" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Amount *</label>
                <input type="number" placeholder="4500" value={form.quoteAmount} onChange={(e) => setForm({ ...form, quoteAmount: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Project Type *</label>
                <input type="text" placeholder="deck build" value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email</label>
                <input type="email" placeholder="sarah@email.com" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <input type="text" placeholder="12x16 cedar deck, wraparound..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Quote Date</label>
                <input type="date" value={form.sentAt} onChange={(e) => setForm({ ...form, sentAt: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <button onClick={addQuote} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Add to Pipeline</button>
          </div>
        )}

        {/* Quote List */}
        {loading ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-500 text-sm">Loading quotes...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 border-dashed p-12 text-center">
            <p className="text-gray-500 text-sm">No quotes yet. Click &quot;+ Add Quote&quot; to start tracking your pipeline.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <div key={quote.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-white">{quote.customer_name}</h3>
                      <p className="text-xs text-gray-400">{quote.project_type} · ${Number(quote.quote_amount || 0).toLocaleString()}{quote.description ? ` · ${quote.description}` : ""}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor(quote.status || "pending")}`}>
                      {quote.status === "followed_up" ? "Followed Up" : (quote.status || "pending").charAt(0).toUpperCase() + (quote.status || "pending").slice(1)}
                    </span>
                    {(quote.status === "pending" || !quote.status) && daysSince(quote.sent_at) >= 2 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-800">
                        {daysSince(quote.sent_at)}d no reply
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(!quote.status || quote.status === "pending" || quote.status === "followed_up") && (
                      <>
                        <button onClick={() => sendFollowUp(quote)} disabled={sendingFollowUp === quote.id}
                          className="text-xs px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50">
                          {sendingFollowUp === quote.id ? "Sending..." : "Follow Up"}
                        </button>
                        <button onClick={() => updateStatus(quote.id, "won")} className="text-xs px-3 py-1.5 rounded-md bg-green-800 hover:bg-green-700 text-green-300 transition-colors">Won</button>
                        <button onClick={() => updateStatus(quote.id, "lost")} className="text-xs px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors">Lost</button>
                      </>
                    )}
                    <span className="text-[10px] text-gray-600">{new Date(quote.sent_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {quote.follow_up_message && (
                  <div className="mt-3 p-2 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                    <p className="text-[10px] text-blue-500 mb-1">Last follow-up · {quote.followed_up_at ? new Date(quote.followed_up_at).toLocaleDateString() : ""}</p>
                    <p className="text-xs text-blue-400 font-mono">{quote.follow_up_message}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
