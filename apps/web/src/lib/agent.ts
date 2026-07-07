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
  decidedBy: "llm" | "rule";
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

const PROMPT = (goal: string, menu: unknown) =>
  `You are an autonomous procurement agent on Hermes, a marketplace where AI agents buy services and settle payment on the Casper blockchain.

Goal: "${goal}"

All listed services are already within budget. Choose the single best service for the goal, weighing capability fit, price, and seller reputation.

Respond with ONLY a JSON object, no prose: {"listingId": "<id>", "rationale": "<one short sentence>"}.

Services:
${JSON.stringify(menu, null, 2)}`;

function menuFor(candidates: ServiceView[]) {
  return candidates.map((c) => ({
    listingId: c.listing.id,
    title: c.listing.title,
    capability: c.listing.capability,
    priceHermes: hermes(c.listing.priceAmount),
    reputation: Number((c.reputation / 100).toFixed(1)),
    seller: c.seller?.displayName,
  }));
}

function parseChoice(text: string): { listingId: string; rationale: string } | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as { listingId?: unknown; rationale?: unknown };
    if (typeof parsed.listingId !== "string") return null;
    return { listingId: parsed.listingId, rationale: String(parsed.rationale ?? "") };
  } catch {
    return null;
  }
}

/**
 * Ask an LLM to choose. Provider-agnostic:
 *  - HERMES_LLM_API_KEY → any OpenAI-compatible endpoint (OpenRouter, NVIDIA NIM,
 *    OpenAI, …) via HERMES_LLM_BASE_URL + HERMES_LLM_MODEL.
 *  - else ANTHROPIC_API_KEY → Anthropic native.
 * Returns null on any failure so the caller falls back to the deterministic rule.
 */
async function llmSelect(
  goal: string,
  candidates: ServiceView[],
): Promise<{ listingId: string; rationale: string; model: string } | null> {
  const prompt = PROMPT(goal, menuFor(candidates));

  // 1. OpenAI-compatible (OpenRouter / NVIDIA NIM / OpenAI / …).
  const llmKey = process.env.HERMES_LLM_API_KEY;
  if (llmKey) {
    const base = (process.env.HERMES_LLM_BASE_URL ?? "https://openrouter.ai/api/v1").replace(/\/$/, "");
    const model = process.env.HERMES_LLM_MODEL ?? "meta-llama/llama-3.3-70b-instruct:free";
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${llmKey}`,
          "content-type": "application/json",
          // Optional attribution headers honoured by OpenRouter; ignored elsewhere.
          "HTTP-Referer": "https://hermes.casper",
          "X-Title": "Hermes",
        },
        body: JSON.stringify({
          model,
          max_tokens: 200,
          temperature: 0.2,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const text = data.choices?.[0]?.message?.content ?? "";
        const choice = parseChoice(text);
        if (choice) return { ...choice, model };
      }
    } catch {
      // fall through
    }
    return null;
  }

  // 2. Anthropic native.
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const model = process.env.HERMES_AGENT_MODEL ?? MODEL_IDS.sonnet;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({ model, max_tokens: 200, messages: [{ role: "user", content: prompt }] }),
      });
      if (res.ok) {
        const data = (await res.json()) as { content?: { type: string; text?: string }[] };
        const text = (data.content ?? [])
          .filter((b) => b.type === "text")
          .map((b) => b.text ?? "")
          .join("");
        const choice = parseChoice(text);
        if (choice) return { ...choice, model };
      }
    } catch {
      // fall through
    }
  }
  return null;
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

  const llm = await llmSelect(input.goal, affordable);
  let chosen: ServiceView | undefined;
  let decidedBy: "llm" | "rule" = "rule";
  let model: string | undefined;
  let rationale = "";
  if (llm) {
    chosen = affordable.find((s) => s.listing.id === llm.listingId);
    if (chosen) {
      decidedBy = "llm";
      model = llm.model;
      rationale = llm.rationale;
    }
  }
  if (!chosen) {
    chosen = ruleSelect(affordable);
    rationale = `Best reputation within budget (${(chosen.reputation / 100).toFixed(1)}★ at ${hermes(chosen.listing.priceAmount)} HERMES).`;
  }

  steps.push({
    kind: "reason",
    label: decidedBy === "llm" ? `LLM (${model}) reasoned` : "Policy agent reasoned",
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
