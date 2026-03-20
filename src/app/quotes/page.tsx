"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";

interface Quote {
  id: string;
  customerName: string;
  customerPhone: string;
  quoteAmount: number;
  projectType: string;
  sentAt: string;
  status: "pending" | "followed_up" | "won" | "lost";
  followUpMessage?: string;
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", quoteAmount: "", projectType: "", sentAt: new Date().toISOString().split("T")[0] });
  const [sendingFollowUp, setSendingFollowUp] = useState<string | null>(null);

  const addQuote = () => {
    if (!form.customerName || !form.customerPhone || !form.quoteAmount || !form.projectType) return;
    const newQuote: Quote = {
      id: `Q-${Date.now()}`,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      quoteAmount: parseFloat(form.quoteAmount),
      projectType: form.projectType,
      sentAt: form.sentAt,
      status: "pending",
    };
    setQuotes([newQuote, ...quotes]);
    setForm({ customerName: "", customerPhone: "", quoteAmount: "", projectType: "", sentAt: new Date().toISOString().split("T")[0] });
    setShowAddForm(false);
  };

  const sendFollowUp = async (quote: Quote) => {
    setSendingFollowUp(quote.id);
    try {
      const res = await fetch("/api/agents/quote-follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: quote.customerName,
          customerPhone: quote.customerPhone,
          quoteAmount: quote.quoteAmount,
          projectType: quote.projectType,
          sentAt: quote.sentAt,
          jobId: quote.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuotes(quotes.map((q) => q.id === quote.id ? { ...q, status: "followed_up" as const, followUpMessage: data.messageSent } : q));
      }
    } catch { /* silent */ }
    finally { setSendingFollowUp(null); }
  };

  const updateStatus = (id: string, status: Quote["status"]) => {
    setQuotes(quotes.map((q) => q.id === id ? { ...q, status } : q));
  };

  const daysSince = (date: string) => Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

  const statusColor = (status: Quote["status"]) => {
    switch (status) {
      case "pending": return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      case "followed_up": return "bg-blue-900/30 text-blue-400 border-blue-800";
      case "won": return "bg-green-900/30 text-green-400 border-green-800";
      case "lost": return "bg-red-900/30 text-red-400 border-red-800";
    }
  };

  const pendingCount = quotes.filter((q) => q.status === "pending").length;
  const followedUpCount = quotes.filter((q) => q.status === "followed_up").length;
  const wonCount = quotes.filter((q) => q.status === "won").length;
  const totalValue = quotes.filter((q) => q.status !== "lost").reduce((sum, q) => sum + q.quoteAmount, 0);

  return (
    <div>
      <PageHeader icon="📋" title="Quote Tracker" description="Track quotes, send AI follow-ups, and manage your pipeline" />
      <div className="px-8 py-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{pendingCount}</div>
            <div className="text-xs text-gray-400 mt-1">Pending</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{followedUpCount}</div>
            <div className="text-xs text-gray-400 mt-1">Followed Up</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{wonCount}</div>
            <div className="text-xs text-gray-400 mt-1">Won</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
            <div className="text-2xl font-bold text-white">${totalValue.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">Pipeline Value</div>
          </div>
        </div>

        {/* Add Quote Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Pipeline</h2>
          <button onClick={() => setShowAddForm(!showAddForm)} className="text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors">
            {showAddForm ? "Cancel" : "+ Add Quote"}
          </button>
        </div>

        {/* Add Quote Form */}
        {showAddForm && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <div className="grid grid-cols-5 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Customer Name</label>
                <input type="text" placeholder="Sarah Johnson" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Phone</label>
                <input type="tel" placeholder="+16045551234" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Amount</label>
                <input type="number" placeholder="4500" value={form.quoteAmount} onChange={(e) => setForm({ ...form, quoteAmount: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Project Type</label>
                <input type="text" placeholder="deck build" value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Quote Date</label>
                <input type="date" value={form.sentAt} onChange={(e) => setForm({ ...form, sentAt: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
            </div>
            <button onClick={addQuote} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Add to Pipeline
            </button>
          </div>
        )}

        {/* Quote List */}
        {quotes.length === 0 ? (
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
                      <h3 className="text-sm font-medium text-white">{quote.customerName}</h3>
                      <p className="text-xs text-gray-400">{quote.projectType} · ${quote.quoteAmount.toLocaleString()}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor(quote.status)}`}>
                      {quote.status === "followed_up" ? "Followed Up" : quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                    </span>
                    {quote.status === "pending" && daysSince(quote.sentAt) >= 2 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-800">
                        {daysSince(quote.sentAt)}d overdue
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(quote.status === "pending" || quote.status === "followed_up") && (
                      <>
                        <button onClick={() => sendFollowUp(quote)} disabled={sendingFollowUp === quote.id}
                          className="text-xs px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50">
                          {sendingFollowUp === quote.id ? "Sending..." : "Send Follow-Up"}
                        </button>
                        <button onClick={() => updateStatus(quote.id, "won")} className="text-xs px-3 py-1.5 rounded-md bg-green-800 hover:bg-green-700 text-green-300 transition-colors">Won</button>
                        <button onClick={() => updateStatus(quote.id, "lost")} className="text-xs px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors">Lost</button>
                      </>
                    )}
                  </div>
                </div>
                {quote.followUpMessage && (
                  <div className="mt-3 p-2 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                    <p className="text-xs text-blue-400 font-mono">{quote.followUpMessage}</p>
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
