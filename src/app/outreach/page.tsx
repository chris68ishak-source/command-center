"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  source: string;
  tags: string;
  subscribed: boolean;
  created_at: string;
}

interface ContactStats {
  total: string;
  subscribed: string;
  unsubscribed: string;
  from_website: string;
  from_manual: string;
}

interface Campaign {
  id: number;
  name: string;
  subject: string;
  status: string;
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  sent_at: string;
  created_at: string;
}

export default function OutreachPage() {
  const [tab, setTab] = useState<"campaigns" | "contacts">("campaigns");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // Campaign creation
  const [showCreate, setShowCreate] = useState(false);
  const [campaignPrompt, setCampaignPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ delivered: number; failed: number; total: number } | null>(null);

  // Contact add
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", city: "" });
  const [addingContact, setAddingContact] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [contactsRes, campaignsRes] = await Promise.all([
        fetch("/api/db/contacts"),
        fetch("/api/db/campaigns"),
      ]);
      const contactsData = await contactsRes.json();
      const campaignsData = await campaignsRes.json();
      if (contactsData.success) {
        setContacts(contactsData.contacts);
        setContactStats(contactsData.stats);
      }
      if (campaignsData.success) {
        setCampaigns(campaignsData.campaigns);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateAndSend = async () => {
    if (!campaignPrompt.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/agents/campaign-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: campaignPrompt }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult(data.stats);
        setCampaignPrompt("");
        loadData();
      } else {
        alert(data.error || "Failed to send campaign");
      }
    } catch {
      alert("Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.email) return;
    setAddingContact(true);
    try {
      const res = await fetch("/api/db/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newContact, source: "manual" }),
      });
      const data = await res.json();
      if (data.success) {
        setNewContact({ name: "", email: "", phone: "", city: "" });
        setShowAddContact(false);
        loadData();
      }
    } catch { /* silent */ }
    finally { setAddingContact(false); }
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm("Remove this contact?")) return;
    try {
      await fetch(`/api/db/contacts?id=${id}`, { method: "DELETE" });
      loadData();
    } catch { /* silent */ }
  };

  const subscribedCount = parseInt(contactStats?.subscribed || "0");

  return (
    <div>
      <PageHeader
        icon="📧"
        title="Email Outreach"
        description="Build your contact list and send email campaigns to generate leads"
      />

      <div className="px-8 py-6 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Contacts", value: contactStats?.total || "0", color: "text-white" },
            { label: "Subscribed", value: contactStats?.subscribed || "0", color: "text-green-400" },
            { label: "From Website", value: contactStats?.from_website || "0", color: "text-blue-400" },
            { label: "Campaigns Sent", value: String(campaigns.filter((c) => c.status === "sent").length), color: "text-rose-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <p className="text-xs text-gray-400">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {([["campaigns", "Campaigns"], ["contacts", "Contacts"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 text-sm py-2.5 px-3 rounded-md transition-colors ${
                tab === key ? "bg-rose-600 text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ═══════════════ CAMPAIGNS TAB ═══════════════ */}
        {tab === "campaigns" && (
          <div className="space-y-4">
            {/* Create Campaign */}
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                + Create Campaign
              </button>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                <h3 className="text-sm font-medium text-white">New Campaign</h3>
                <p className="text-xs text-gray-400">
                  Describe your campaign and AI will generate the email. It will be sent to all {subscribedCount} subscribed contacts.
                </p>
                <textarea
                  value={campaignPrompt}
                  onChange={(e) => setCampaignPrompt(e.target.value)}
                  placeholder="e.g. Spring deck season promotion — 15% off new deck builds booked before April 30. Mention our 30+ years of experience and free quotes."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-rose-500 focus:outline-none resize-none"
                  rows={3}
                />

                {sendResult && (
                  <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
                    <p className="text-sm text-green-400 font-medium">Campaign sent!</p>
                    <p className="text-xs text-green-300 mt-1">
                      {sendResult.delivered} delivered · {sendResult.failed} failed · {sendResult.total} total
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateAndSend}
                    disabled={sending || !campaignPrompt.trim() || subscribedCount === 0}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {sending ? "Generating & Sending..." : `Generate & Send to ${subscribedCount} contacts`}
                  </button>
                  <button
                    onClick={() => { setShowCreate(false); setSendResult(null); }}
                    className="text-gray-400 hover:text-gray-200 text-sm px-4 py-2.5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Campaign History */}
            {loading ? (
              <p className="text-sm text-gray-500">Loading campaigns...</p>
            ) : campaigns.length === 0 ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
                <p className="text-gray-400 text-sm">No campaigns yet. Create your first one above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => (
                  <div key={c.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          c.status === "sent" ? "bg-green-900/50 text-green-400"
                          : c.status === "sending" ? "bg-yellow-900/50 text-yellow-400"
                          : "bg-gray-800 text-gray-400"
                        }`}>
                          {c.status}
                        </span>
                        <h4 className="text-sm text-white font-medium">{c.name}</h4>
                      </div>
                      <p className="text-xs text-gray-500">Subject: {c.subject}</p>
                    </div>
                    <div className="text-right">
                      {c.status === "sent" && (
                        <div className="text-xs text-gray-400">
                          <span className="text-green-400">{c.total_delivered} delivered</span>
                          {c.total_failed > 0 && (
                            <span className="text-red-400 ml-2">{c.total_failed} failed</span>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-1">
                        {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : new Date(c.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ CONTACTS TAB ═══════════════ */}
        {tab === "contacts" && (
          <div className="space-y-4">
            {/* Add Contact */}
            {!showAddContact ? (
              <button
                onClick={() => setShowAddContact(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                + Add Contact
              </button>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
                <h3 className="text-sm font-medium text-white">Add Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="Full Name *"
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-rose-500 focus:outline-none"
                  />
                  <input
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="Email *"
                    type="email"
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-rose-500 focus:outline-none"
                  />
                  <input
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="Phone (optional)"
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-rose-500 focus:outline-none"
                  />
                  <input
                    value={newContact.city}
                    onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                    placeholder="City (optional)"
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddContact}
                    disabled={addingContact || !newContact.name || !newContact.email}
                    className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {addingContact ? "Adding..." : "Add Contact"}
                  </button>
                  <button onClick={() => setShowAddContact(false)} className="text-gray-400 hover:text-gray-200 text-sm px-4 py-2.5">Cancel</button>
                </div>
              </div>
            )}

            {/* Contact List */}
            {loading ? (
              <p className="text-sm text-gray-500">Loading contacts...</p>
            ) : contacts.length === 0 ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center space-y-3">
                <p className="text-gray-400 text-sm">No contacts yet.</p>
                <p className="text-gray-500 text-xs">Add contacts manually, or they&apos;ll be auto-added when someone submits a quote on your website.</p>
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3">Email</th>
                      <th className="text-left px-4 py-3">City</th>
                      <th className="text-left px-4 py-3">Source</th>
                      <th className="text-left px-4 py-3">Added</th>
                      <th className="text-right px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="px-4 py-3 text-sm text-white">{c.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{c.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{c.city || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            c.source === "website" ? "bg-blue-900/50 text-blue-400"
                            : c.source === "import" ? "bg-purple-900/50 text-purple-400"
                            : "bg-gray-800 text-gray-400"
                          }`}>
                            {c.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
