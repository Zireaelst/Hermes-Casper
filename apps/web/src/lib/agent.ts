import "server-only";

import { MODEL_IDS, formatAmount } from "@hermes/shared";
import { discoverServices, purchaseService, type PurchaseOutcome, type ServiceView } from "./commerce";
import { recordAgentRun } from "./data";

/**
 * Autonomous buyer agent. Given a goal + budget, it discovers services, decides
 * which to buy (Claude when ANTHROPIC_API_KEY is set, deterministic rule
 * otherwise), then executes the x402 purchase — settling on Casper without a
 * human in the loop. Every run is traced and persisted (agent_runs).
 */

export type AgentStepKind = "discover" | "reason" | "select" | "settle" | "error";

export interface AgentStep {
  kind: AgentStepKind;
  label: string;
  detail?: string;
  data?: Record<string, unknown>;
}

export interface AgentRunTrace extends Record<string, unknown> {
  goal: string;
  budgetHermes: number;
  capability?: string;
  decidedBy: "claude" | "rule";
  model?: string;
  steps: AgentStep[];
}

export interface RunAgentInput {
  goal: string;
  budgetHermes: number;
  capability?: string;
}

export interface RunAgentResult {
  runId: string;
  status: "settled" | "awaiting_approval" | "failed";
  trace: AgentRunTrace;
  outcome?: PurchaseOutcome;
}

const hermes = (base: string) => Number(formatAmount(base, 9));

/** Deterministic pick: highest reputation, tie-break on lowest price. */
function ruleSelect(candidates: ServiceView[]): ServiceView {
  return [...candidates].sort(
    (a, b) =>
      b.reputation - a.reputation ||
      (BigInt(a.listing.priceAmount) < BigInt(b.listing.priceAmount) ? -1 : 1),
  )[0]!;
}

/** Ask Claude to choose. Returns null on any failure so the caller falls back. */
async function claudeSelect(
  goal: string,
  candidates: ServiceView[],
): Promise<{ listingId: string; rationale: string; model: string } | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.HERMES_AGENT_MODEL ?? MODEL_IDS.sonnet;
  const menu = candidates.map((c) => ({
    listingId: c.listing.id,
    title: c.listing.title,
    capability: c.listing.capability,
    priceHermes: hermes(c.listing.priceAmount),
    reputation: Number((c.reputation / 100).toFixed(1)),
    seller: c.seller?.displayName,
  }));
  const prompt = `You are an autonomous procurement agent on Hermes, a marketplace where AI agents buy services and settle payment on the Casper blockchain.

Goal: "${goal}"

All listed services are already within budget. Choose the single best service for the goal, weighing capability fit, price, and seller reputation.

Respond with ONLY a JSON object, no prose: {"listingId": "<id>", "rationale": "<one short sentence>"}.

Services:
${JSON.stringify(menu, null, 2)}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({ model, max_tokens: 200, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (data.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as { listingId?: unknown; rationale?: unknown };
    if (typeof parsed.listingId !== "string") return null;
    return { listingId: parsed.listingId, rationale: String(parsed.rationale ?? ""), model };
  } catch {
    return null;
  }
}

export async function runAgent(input: RunAgentInput): Promise<RunAgentResult> {
  const steps: AgentStep[] = [];
  const budgetBase = BigInt(Math.round(input.budgetHermes * 1e9));

  const all = await discoverServices({ capability: input.capability });
  const affordable = all.filter((s) => BigInt(s.listing.priceAmount) <= budgetBase);
  steps.push({
    kind: "discover",
    label: `Discovered ${all.length} service${all.length === 1 ? "" : "s"}`,
    detail: input.capability ? `capability = ${input.capability}` : "no capability filter",
    data: { affordable: affordable.length, budgetHermes: input.budgetHermes },
  });

  if (affordable.length === 0) {
    steps.push({
      kind: "error",
      label: "No service within budget",
      detail: `nothing at or below ${input.budgetHermes} HERMES`,
    });
    const trace: AgentRunTrace = {
      goal: input.goal,
      budgetHermes: input.budgetHermes,
      capability: input.capability,
      decidedBy: "rule",
      steps,
    };
    const runId = await recordAgentRun({ status: "failed", trace });
    return { runId, status: "failed", trace };
  }

  const claude = await claudeSelect(input.goal, affordable);
  let chosen: ServiceView | undefined;
  let decidedBy: "claude" | "rule" = "rule";
  let model: string | undefined;
  let rationale = "";
  if (claude) {
    chosen = affordable.find((s) => s.listing.id === claude.listingId);
    if (chosen) {
      decidedBy = "claude";
      model = claude.model;
      rationale = claude.rationale;
    }
  }
  if (!chosen) {
    chosen = ruleSelect(affordable);
    rationale = `Best reputation within budget (${(chosen.reputation / 100).toFixed(1)}★ at ${hermes(chosen.listing.priceAmount)} HERMES).`;
  }

  steps.push({
    kind: "reason",
    label: decidedBy === "claude" ? `Claude (${model}) reasoned` : "Policy agent reasoned",
    detail: rationale,
  });
  steps.push({
    kind: "select",
    label: `Selected "${chosen.listing.title}"`,
    detail: `${hermes(chosen.listing.priceAmount)} HERMES · ${chosen.seller?.displayName ?? "seller"}`,
    data: { listingId: chosen.listing.id },
  });

  const outcome = await purchaseService(chosen.listing.id);
  if (outcome.status === "settled") {
    steps.push({
      kind: "settle",
      label: "Settled on-chain",
      detail: outcome.deployHash,
      data: {
        deployHash: outcome.deployHash,
        explorerUrl: outcome.explorerUrl,
        orderId: outcome.orderId,
      },
    });
  } else if (outcome.status === "awaiting_approval") {
    steps.push({
      kind: "settle",
      label: "Parked for human approval (over spend limit)",
      detail: outcome.reason,
      data: { orderId: outcome.orderId },
    });
  } else {
    steps.push({
      kind: "error",
      label: "Settlement failed",
      detail: outcome.reason,
      data: { orderId: outcome.orderId },
    });
  }

  const trace: AgentRunTrace = {
    goal: input.goal,
    budgetHermes: input.budgetHermes,
    capability: input.capability,
    decidedBy,
    model,
    steps,
  };
  const runId = await recordAgentRun({ status: outcome.status, trace, orderId: outcome.orderId });
  return { runId, status: outcome.status, trace, outcome };
}
