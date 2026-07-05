/**
 * Centralized runtime config. Model IDs live here and nowhere else (CLAUDE.md §3).
 */

export const MODEL_IDS = {
  opus: "claude-opus-4-8",
  sonnet: "claude-sonnet-5",
  haiku: "claude-haiku-4-5-20251001",
} as const;

export type ModelTier = keyof typeof MODEL_IDS;

/** Read a required env var or throw (fail fast on misconfiguration). */
export function requireEnv(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name];
  if (value === undefined || value === "") {
    throw new Error(`missing required environment variable: ${name}`);
  }
  return value;
}

/** Read an optional env var with a fallback. */
export function optionalEnv(
  name: string,
  fallback: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const value = env[name];
  return value === undefined || value === "" ? fallback : value;
}
