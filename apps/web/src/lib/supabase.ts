import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client (anon key). The MVP has no auth yet, so the trusted server
 * uses the anon key against demo-open RLS policies (migration 3). When the
 * env vars are absent — or HERMES_FORCE_DEMO is set (E2E) — the app falls back
 * to the in-memory demo store so tests stay deterministic.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function supabaseEnabled(): boolean {
  return Boolean(url && anonKey) && process.env.HERMES_FORCE_DEMO !== "1";
}

let cached: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!url || !anonKey) throw new Error("Supabase env not configured");
  cached ??= createClient(url, anonKey, { auth: { persistSession: false } });
  return cached;
}
