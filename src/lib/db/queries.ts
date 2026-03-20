import { sql } from "@vercel/postgres";

// ─────────────────────────────────────────────────────────────
//  Quote Queries
// ─────────────────────────────────────────────────────────────

export async function createQuote(data: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  quoteAmount: number;
  projectType: string;
  description?: string;
  sentAt?: string;
}) {
  const result = await sql`
    INSERT INTO quotes (customer_name, customer_phone, customer_email, quote_amount, project_type, description, sent_at)
    VALUES (${data.customerName}, ${data.customerPhone}, ${data.customerEmail || null}, ${data.quoteAmount}, ${data.projectType}, ${data.description || null}, ${data.sentAt || new Date().toISOString()})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getQuotes(status?: string) {
  if (status) {
    const result = await sql`SELECT * FROM quotes WHERE status = ${status} ORDER BY created_at DESC`;
    return result.rows;
  }
  const result = await sql`SELECT * FROM quotes ORDER BY created_at DESC`;
  return result.rows;
}

export async function getQuoteById(id: number) {
  const result = await sql`SELECT * FROM quotes WHERE id = ${id}`;
  return result.rows[0] || null;
}

export async function updateQuoteStatus(id: number, status: string) {
  const closedAt = (status === "won" || status === "lost") ? new Date().toISOString() : null;
  const result = await sql`
    UPDATE quotes SET status = ${status}, closed_at = ${closedAt}, updated_at = NOW()
    WHERE id = ${id} RETURNING *
  `;
  return result.rows[0];
}

export async function updateQuoteFollowUp(id: number, message: string) {
  const result = await sql`
    UPDATE quotes SET status = 'followed_up', followed_up_at = NOW(), follow_up_message = ${message}, updated_at = NOW()
    WHERE id = ${id} RETURNING *
  `;
  return result.rows[0];
}

export async function getQuoteStats() {
  const result = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'followed_up') as followed_up,
      COUNT(*) FILTER (WHERE status = 'won') as won,
      COUNT(*) FILTER (WHERE status = 'lost') as lost,
      COALESCE(SUM(quote_amount) FILTER (WHERE status NOT IN ('lost')), 0) as pipeline_value,
      COALESCE(SUM(quote_amount) FILTER (WHERE status = 'won'), 0) as won_value
    FROM quotes
  `;
  return result.rows[0];
}

// ─────────────────────────────────────────────────────────────
//  Job Queries
// ─────────────────────────────────────────────────────────────

export async function createJob(data: {
  quoteId?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  projectType: string;
  description?: string;
  amount?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  address?: string;
  notes?: string;
}) {
  const result = await sql`
    INSERT INTO jobs (quote_id, customer_name, customer_phone, customer_email, project_type, description, amount, status, start_date, end_date, address, notes)
    VALUES (${data.quoteId || null}, ${data.customerName}, ${data.customerPhone}, ${data.customerEmail || null}, ${data.projectType}, ${data.description || null}, ${data.amount || null}, ${data.status || 'in_progress'}, ${data.startDate || null}, ${data.endDate || null}, ${data.address || null}, ${data.notes || null})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getJobs(status?: string) {
  if (status) {
    const result = await sql`SELECT * FROM jobs WHERE status = ${status} ORDER BY created_at DESC`;
    return result.rows;
  }
  const result = await sql`SELECT * FROM jobs ORDER BY created_at DESC`;
  return result.rows;
}

export async function getJobById(id: number) {
  const result = await sql`SELECT * FROM jobs WHERE id = ${id}`;
  return result.rows[0] || null;
}

export async function updateJob(id: number, data: {
  status?: string;
  endDate?: string;
  notes?: string;
  amount?: number;
}) {
  const result = await sql`
    UPDATE jobs SET
      status = COALESCE(${data.status || null}, status),
      end_date = COALESCE(${data.endDate || null}, end_date),
      notes = COALESCE(${data.notes || null}, notes),
      amount = COALESCE(${data.amount || null}, amount),
      updated_at = NOW()
    WHERE id = ${id} RETURNING *
  `;
  return result.rows[0];
}

export async function getJobStats() {
  const result = await sql`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_revenue,
      COALESCE(SUM(amount), 0) as total_value
    FROM jobs
  `;
  return result.rows[0];
}

// ─────────────────────────────────────────────────────────────
//  Review Request Queries
// ─────────────────────────────────────────────────────────────

export async function logReviewRequest(data: {
  jobId?: number;
  customerName: string;
  customerPhone: string;
  projectType: string;
  messageSent: string;
  twilioSid?: string;
}) {
  const result = await sql`
    INSERT INTO review_requests (job_id, customer_name, customer_phone, project_type, message_sent, twilio_sid)
    VALUES (${data.jobId || null}, ${data.customerName}, ${data.customerPhone}, ${data.projectType}, ${data.messageSent}, ${data.twilioSid || null})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getReviewRequests() {
  const result = await sql`SELECT * FROM review_requests ORDER BY sent_at DESC`;
  return result.rows;
}

// ─────────────────────────────────────────────────────────────
//  Follow-Up Log Queries
// ─────────────────────────────────────────────────────────────

export async function logFollowUp(data: {
  quoteId: number;
  messageSent: string;
  twilioSid?: string;
}) {
  const result = await sql`
    INSERT INTO follow_up_log (quote_id, message_sent, twilio_sid)
    VALUES (${data.quoteId}, ${data.messageSent}, ${data.twilioSid || null})
    RETURNING *
  `;
  return result.rows[0];
}

export async function getFollowUpsForQuote(quoteId: number) {
  const result = await sql`SELECT * FROM follow_up_log WHERE quote_id = ${quoteId} ORDER BY sent_at DESC`;
  return result.rows;
}
