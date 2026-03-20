import { sql } from "@vercel/postgres";

// ─────────────────────────────────────────────────────────────
//  Database Schema
//  Run once on first deploy to create tables
//  Safe to run multiple times (IF NOT EXISTS)
// ─────────────────────────────────────────────────────────────

export async function initializeDatabase() {
  // Quotes table — tracks every quote sent to a potential customer
  await sql`
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      quote_amount NUMERIC(10,2) NOT NULL,
      project_type TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
      followed_up_at TIMESTAMP,
      follow_up_message TEXT,
      closed_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  // Jobs table — tracks completed/in-progress work
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      quote_id INTEGER REFERENCES quotes(id),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      project_type TEXT NOT NULL,
      description TEXT,
      amount NUMERIC(10,2),
      status TEXT NOT NULL DEFAULT 'in_progress',
      start_date DATE,
      end_date DATE,
      address TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  // Review requests table — logs every review SMS sent
  await sql`
    CREATE TABLE IF NOT EXISTS review_requests (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      project_type TEXT NOT NULL,
      message_sent TEXT NOT NULL,
      twilio_sid TEXT,
      sent_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  // Follow-up log — tracks every follow-up SMS sent for quotes
  await sql`
    CREATE TABLE IF NOT EXISTS follow_up_log (
      id SERIAL PRIMARY KEY,
      quote_id INTEGER REFERENCES quotes(id),
      message_sent TEXT NOT NULL,
      twilio_sid TEXT,
      sent_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  return { success: true, message: "Database initialized" };
}
