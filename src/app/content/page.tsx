"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";

interface ContentResult {
  blogPost?: { title: string; body: string; metaDescription: string };
  socialCaptions?: { day: string; platform: string; caption: string; hashtags: string[] }[];
  googleBusinessPost?: string;
  newsletterBlurb?: string;
  topic?: string;
}

export default function ContentPage() {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState<ContentResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<"blog" | "social" | "gbp" | "newsletter">("blog");

  const generate = async () => {
    setGenerating(true); setContent(null);
    try {
      const res = await fetch("/api/agents/content-generator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topic || undefined }) });
      const data = await res.json();
      if (data.success) { setContent(data.content); setTab("blog"); }
    } catch { /* silent */ }
    finally { setGenerating(false); }
  };

  return (
    <div>
      <PageHeader icon="✍️" title="Content Generator" description="Generate a full week of marketing content — blog, social, GBP, newsletter" />
      <div className="px-8 py-6 space-y-6">

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex gap-3 mb-4">
            <input type="text" placeholder="Custom topic (leave empty for seasonal auto-pick)" value={topic} onChange={(e) => setTopic(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors" />
            <button onClick={generate} disabled={generating} className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
              {generating ? "Generating..." : "Generate Week"}
            </button>
          </div>
        </div>

        {content && (
          <div className="space-y-4">
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              {([["blog", "Blog Post"], ["social", "Social (7 days)"], ["gbp", "Google Business"], ["newsletter", "Newsletter"]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} className={`flex-1 text-xs py-2.5 px-3 rounded-md transition-colors ${tab === key ? "bg-purple-600 text-white" : "text-gray-400 hover:text-gray-200"}`}>{label}</button>
              ))}
            </div>

            {tab === "blog" && content.blogPost && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-3">
                <h3 className="text-white font-medium">{content.blogPost.title}</h3>
                <p className="text-xs text-purple-400 italic">{content.blogPost.metaDescription}</p>
                <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto bg-gray-800/50 rounded-lg p-4">{content.blogPost.body}</div>
              </div>
            )}

            {tab === "social" && content.socialCaptions && (
              <div className="space-y-3">
                {content.socialCaptions.map((post, i) => (
                  <div key={i} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-purple-400">{post.day}</span>
                      <span className="text-xs text-gray-500">·</span>
                      <span className="text-xs text-gray-400">{post.platform}</span>
                    </div>
                    <p className="text-sm text-gray-300">{post.caption}</p>
                    {post.hashtags.length > 0 && <p className="text-xs text-blue-400 mt-2">{post.hashtags.map((h) => `#${h}`).join(" ")}</p>}
                  </div>
                ))}
              </div>
            )}

            {tab === "gbp" && content.googleBusinessPost && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <p className="text-sm text-gray-300 leading-relaxed">{content.googleBusinessPost}</p>
              </div>
            )}

            {tab === "newsletter" && content.newsletterBlurb && (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                <p className="text-sm text-gray-300 leading-relaxed">{content.newsletterBlurb}</p>
              </div>
            )}

            <p className="text-xs text-gray-600">Topic: {content.topic} · Copy any text and paste into your platforms</p>
          </div>
        )}
      </div>
    </div>
  );
}
