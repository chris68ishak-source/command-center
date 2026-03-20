"use client";

import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";

interface Job {
  id: number;
  quote_id?: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  project_type: string;
  description?: string;
  amount?: number;
  status: string;
  start_date?: string;
  end_date?: string;
  address?: string;
  notes?: string;
  created_at: string;
}

interface JobStats {
  total: string;
  in_progress: string;
  completed: string;
  total_revenue: string;
  total_value: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", customerEmail: "", projectType: "",
    description: "", amount: "", address: "", notes: "", startDate: new Date().toISOString().split("T")[0],
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingReview, setSendingReview] = useState<number | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      const statusParam = filter !== "all" ? `?status=${filter}` : "";
      const [jobsRes, statsRes] = await Promise.all([
        fetch(`/api/db/jobs${statusParam}`),
        fetch("/api/db/jobs?stats=true"),
      ]);
      const jobsData = await jobsRes.json();
      const statsData = await statsRes.json();
      if (jobsData.success) setJobs(jobsData.jobs);
      if (statsData.success) setStats(statsData.stats);
    } catch (err) { console.error("Jobs error:", err); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const addJob = async () => {
    if (!form.customerName || !form.customerPhone || !form.projectType) return;
    try {
      const res = await fetch("/api/db/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: form.amount ? parseFloat(form.amount) : null }),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ customerName: "", customerPhone: "", customerEmail: "", projectType: "", description: "", amount: "", address: "", notes: "", startDate: new Date().toISOString().split("T")[0] });
        setShowAddForm(false);
        loadJobs();
      }
    } catch (err) { console.error("Jobs error:", err); }
  };

  const updateJob = async (id: number, updates: Record<string, string | number | undefined>) => {
    try {
      const res = await fetch("/api/db/jobs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", id, ...updates }),
      });
      const data = await res.json();
      if (data.success) { setEditingId(null); loadJobs(); }
    } catch (err) { console.error("Jobs error:", err); }
  };

  const sendReviewRequest = async (job: Job) => {
    setSendingReview(job.id);
    try {
      const res = await fetch("/api/agents/review-requester", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: job.customer_name, customerPhone: job.customer_phone,
          projectType: job.project_type, jobId: `J-${job.id}`,
        }),
      });
      const data = await res.json();
      if (data.success) { loadJobs(); }
    } catch (err) { console.error("Jobs error:", err); }
    finally { setSendingReview(null); }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-blue-900/30 text-blue-400 border-blue-800";
      case "completed": return "bg-green-900/30 text-green-400 border-green-800";
      default: return "bg-gray-900/30 text-gray-400 border-gray-800";
    }
  };

  return (
    <div>
      <PageHeader icon="🔨" title="Job Tracker" description="Track all past and current jobs — your full project database" />
      <div className="px-8 py-6 space-y-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400 mt-1">Total Jobs</div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.in_progress}</div>
              <div className="text-xs text-gray-400 mt-1">In Progress</div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-xs text-gray-400 mt-1">Completed</div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
              <div className="text-2xl font-bold text-white">${Number(stats.total_revenue).toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">Total Revenue</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mr-3">Jobs</h2>
            {["all", "in_progress", "completed"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors ${filter === f ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                {f === "all" ? "All" : f === "in_progress" ? "In Progress" : "Completed"}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} className="text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors">
            {showAddForm ? "Cancel" : "+ Add Job"}
          </button>
        </div>

        {/* Add Job Form */}
        {showAddForm && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <p className="text-xs text-gray-400 mb-3">Add a past or new job to your database.</p>
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
                <label className="text-xs text-gray-400 block mb-1">Project Type *</label>
                <input type="text" placeholder="deck build" value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Amount</label>
                <input type="number" placeholder="4500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Email</label>
                <input type="email" placeholder="sarah@email.com" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Address</label>
                <input type="text" placeholder="123 Main St, Burnaby" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Description</label>
                <input type="text" placeholder="12x16 cedar deck..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1">Notes</label>
              <textarea placeholder="Any additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
            </div>
            <button onClick={addJob} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Add Job</button>
          </div>
        )}

        {/* Job List */}
        {loading ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-500 text-sm">Loading jobs...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 border-dashed p-12 text-center">
            <p className="text-gray-500 text-sm">No jobs yet. Jobs are created automatically when a quote is marked &quot;Won&quot;, or click &quot;+ Add Job&quot; to add past jobs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-white">{job.customer_name}</h3>
                      <p className="text-xs text-gray-400">
                        {job.project_type}
                        {job.amount ? ` · $${Number(job.amount).toLocaleString()}` : ""}
                        {job.address ? ` · ${job.address}` : ""}
                        {job.description ? ` · ${job.description}` : ""}
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor(job.status)}`}>
                      {job.status === "in_progress" ? "In Progress" : "Completed"}
                    </span>
                    {job.quote_id && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 border border-purple-800">
                        Quote #{job.quote_id}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === "in_progress" && (
                      <button onClick={() => updateJob(job.id, { status: "completed", endDate: new Date().toISOString().split("T")[0] })}
                        className="text-xs px-3 py-1.5 rounded-md bg-green-800 hover:bg-green-700 text-green-300 transition-colors">
                        Mark Complete
                      </button>
                    )}
                    {job.status === "completed" && (
                      <button onClick={() => sendReviewRequest(job)} disabled={sendingReview === job.id}
                        className="text-xs px-3 py-1.5 rounded-md bg-orange-600 hover:bg-orange-500 text-white transition-colors disabled:opacity-50">
                        {sendingReview === job.id ? "Sending..." : "Request Review"}
                      </button>
                    )}
                    <button onClick={() => { setEditingId(editingId === job.id ? null : job.id); setEditNotes(job.notes || ""); }}
                      className="text-xs px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors">
                      {editingId === job.id ? "Close" : "Notes"}
                    </button>
                    <span className="text-[10px] text-gray-600">
                      {job.start_date ? new Date(job.start_date).toLocaleDateString() : new Date(job.created_at).toLocaleDateString()}
                      {job.end_date ? ` → ${new Date(job.end_date).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                </div>

                {/* Notes editor */}
                {editingId === job.id && (
                  <div className="mt-3 flex gap-2">
                    <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} placeholder="Add notes about this job..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none" />
                    <button onClick={() => updateJob(job.id, { notes: editNotes })}
                      className="self-end text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                      Save
                    </button>
                  </div>
                )}

                {/* Show existing notes */}
                {job.notes && editingId !== job.id && (
                  <div className="mt-2 p-2 bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-400">{job.notes}</p>
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
