"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";

interface ReviewRequest {
  id: number;
  job_id?: number;
  customer_name: string;
  customer_phone: string;
  project_type: string;
  message_sent: string;
  twilio_sid?: string;
  sent_at: string;
}

export default function ReviewsPage() {
  const [form, setForm] = useState({ customerName: "", customerPhone: "", projectType: "" });
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<ReviewRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/db/reviews");
      const data = await res.json();
      if (data.success) setHistory(data.reviews);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const sendRequest = async () => {
    if (!form.customerName || !form.customerPhone || !form.projectType) { setResult({ error: "Please fill in all fields" }); return; }
    setSending(true); setResult(null);
    try {
      const res = await fetch("/api/agents/review-requester", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, message: data.messageSent });
        setForm({ customerName: "", customerPhone: "", projectType: "" });
        loadHistory(); // Reload from DB
      } else { setResult({ error: data.error || "Something went wrong" }); }
    } catch { setResult({ error: "Network error — please try again" }); }
    finally { setSending(false); }
  };

  return (
    <div>
      <PageHeader icon="⭐" title="Review Requester" description="Send personalized SMS review requests after job completion" />
      <div className="px-8 py-6 space-y-6">

        {/* Send Form */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <p className="text-xs text-gray-400 mb-4">Enter job details — Claude writes a personalized SMS and sends it via Twilio.</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Customer Name</label>
              <input type="text" placeholder="Sarah Johnson" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Customer Phone</label>
              <input type="tel" placeholder="+16045551234" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Project Type</label>
              <input type="text" placeholder="deck build, fence, renovation..." value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
          <button onClick={sendRequest} disabled={sending} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {sending ? "Sending..." : "Send Review Request"}
          </button>
          {result && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${result.success ? "bg-green-900/30 border border-green-800 text-green-300" : "bg-red-900/30 border border-red-800 text-red-300"}`}>
              {result.success ? (<><p className="font-medium mb-1">SMS sent successfully</p><p className="text-xs text-green-400 font-mono bg-green-900/30 p-2 rounded">{result.message}</p></>) : (<p>{result.error}</p>)}
            </div>
          )}
        </div>

        {/* History from Database */}
        <div>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Review Request History</h2>
          {loading ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
              <p className="text-gray-500 text-sm">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-gray-900 rounded-xl border border-gray-800 border-dashed p-12 text-center">
              <p className="text-gray-500 text-sm">No review requests sent yet. Send your first one above, or use the &quot;Request Review&quot; button on completed jobs.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((review) => (
                <div key={review.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-white font-medium">{review.customer_name}</p>
                      <span className="text-[10px] text-gray-500">{review.project_type}</span>
                      {review.twilio_sid && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-800">Delivered</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-1 truncate">{review.message_sent}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0 ml-4">{new Date(review.sent_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
