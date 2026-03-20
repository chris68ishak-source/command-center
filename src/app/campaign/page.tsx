"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";

interface CampaignResult {
  month?: string;
  theme?: string;
  headline?: string;
  offer?: string;
  adCopy?: { google: string; facebook: string; instagram: string };
  emailDraft?: { subject: string; body: string };
  flyerText?: string;
  talkingPoints?: string[];
  summary?: string;
}

export default function CampaignPage() {
  const [campaign, setCampaign] = useState<CampaignResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"ads" | "email" | "flyer" | "talking">("ads");

  const generate = async () => {
    setLoading(true); setCampaign(null);
    try {
      const res = await fetch("/api/agents/seasonal-campaign", { method: "POST" });
      const data = await res.json();
      if (data.success) { setCampaign(data.campaign); setTab("ads"); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader icon="📅" title="Seasonal Campaigner" description="Generate a complete campaign kit for this month — ads, email, flyer, talking points" />
      <div className="px-8 py-6 space-y-6">

        <button onClick={generate} disabled={loading} className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
          {loading ? "Generating Campaign..." : "Generate This Month's Campaign"}
        </button>

        {campaign && (
          <div className="space-y-6">
            {/* Campaign Header */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs bg-rose-900/50 text-rose-400 px-2 py-0.5 rounded">{campaign.month}</span>
                <span className="text-xs text-gray-500">·</span>
                <span className="text-xs text-gray-400">{campaign.theme}</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{campaign.headline}</h2>
              <p className="text-sm text-rose-300 font-medium mb-3">{campaign.offer}</p>
              <p className="text-sm text-gray-300">{campaign.summary}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              {([["ads", "Ad Copy"], ["email", "Email Draft"], ["flyer", "Flyer Text"], ["talking", "Talking Points"]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} className={`flex-1 text-xs py-2.5 px-3 rounded-md transition-colors ${tab === key ? "bg-rose-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>{label}</button>
              ))}
            </div>

            {tab === "ads" && campaign.adCopy && (
              <div className="space-y-3">
                {[
                  { platform: "Google Ads", text: campaign.adCopy.google, color: "text-blue-400" },
                  { platform: "Facebook", text: campaign.adCopy.facebook, color: "text-indigo-400" },
                  { platform: "Instagram", text: campaign.adCopy.instagram, color: "text-pink-400" },
                ].map((ad) => (
                  <div key={ad.platform} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                    <p className={`text-xs font-medium ${ad.color} mb-2`}>{ad.platform}</p>
                    <p className="text-sm text-gray-300 leading-relaxed">{ad.text}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === "email" && campaign.emailDraft && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
                <div className="bg-gray-800/50 rounded-lg px-4 py-2">
                  <span className="text-xs text-gray-400">Subject:</span>
                  <span className="text-sm text-white font-medium ml-2">{campaign.emailDraft.subject}</span>
                </div>
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-800/50 rounded-lg p-4">
                  {campaign.emailDraft.body}
                </div>
              </div>
            )}

            {tab === "flyer" && campaign.flyerText && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{campaign.flyerText}</p>
              </div>
            )}

            {tab === "talking" && campaign.talkingPoints && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
                <p className="text-xs text-gray-400 mb-2">Use these when meeting potential customers or cold-calling this month:</p>
                {campaign.talkingPoints.map((tp, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3">
                    <span className="text-xs bg-rose-900/50 text-rose-400 rounded px-2 py-0.5 mt-0.5 shrink-0">{i + 1}</span>
                    {tp}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
