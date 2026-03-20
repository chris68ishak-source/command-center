import { NextRequest, NextResponse } from "next/server";
import { createJob, getJobs, getJobStats, updateJob } from "@/lib/db/queries";
import { requireAuth } from "@/lib/auth";

// GET /api/db/jobs — list all jobs, optionally filter by status
export async function GET(request: NextRequest) {
  const denied = requireAuth(request);
  if (denied) return denied;

  try {
    const status = request.nextUrl.searchParams.get("status") || undefined;
    const stats = request.nextUrl.searchParams.get("stats");

    if (stats === "true") {
      const jobStats = await getJobStats();
      return NextResponse.json({ success: true, stats: jobStats });
    }

    const jobs = await getJobs(status);
    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("Get jobs error:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

// POST /api/db/jobs — create or update a job
export async function POST(request: NextRequest) {
  const denied = requireAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();

    // Update job
    if (body.action === "update" && body.id) {
      const job = await updateJob(body.id, body);
      return NextResponse.json({ success: true, job });
    }

    // Create new job
    if (!body.customerName || !body.customerPhone || !body.projectType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const job = await createJob(body);
    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Job operation error:", error);
    return NextResponse.json({ error: "Job operation failed" }, { status: 500 });
  }
}
