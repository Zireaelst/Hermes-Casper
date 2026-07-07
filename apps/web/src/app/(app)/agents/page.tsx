import { AlertTriangle, ArrowUpRight, Bot, CheckCircle2, Clock, Radar, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { Badge, Card, EmptyState, PageHeader, SubmitButton } from "@/components/ui";
import { runAgentAction } from "@/lib/actions";
import type { AgentStep } from "@/lib/agent";
import { loadAgentRuns } from "@/lib/data";

export const dynamic = "force-dynamic";

const CAPABILITIES = [
  "rwa.valuation",
  "defi.yield",
  "credit.score",
  "rwa.compliance",
  "research.web",
  "translate.text",
  "summarize.text",
];

const STEP_ICON: Record<AgentStep["kind"], typeof Radar> = {
  discover: Radar,
  reason: Sparkles,
  select: Target,
  settle: CheckCircle2,
  error: AlertTriangle,
};

const STATUS_META: Record<string, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  settled: { label: "settled on-chain", cls: "text-success", icon: CheckCircle2 },
  awaiting_approval: { label: "awaiting approval", cls: "text-warning", icon: Clock },
  failed: { label: "failed", cls: "text-danger", icon: AlertTriangle },
};

export default async function AgentsPage() {
  const runs = await loadAgentRuns();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Autonomous Agents"
        sub="Give the buyer agent a goal and a budget. It discovers services, decides (an LLM, or a policy fallback), and settles on Casper — no human in the loop."
      />

      <Card>
        <form action={runAgentAction} className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div>
            <label htmlFor="goal" className="mb-1.5 block text-xs font-medium text-text-muted">
              Goal
            </label>
            <input
              id="goal"
              name="goal"
              required
              placeholder="e.g. Value a tokenized real-estate asset"
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus/50"
            />
          </div>
          <div>
            <label htmlFor="capability" className="mb-1.5 block text-xs font-medium text-text-muted">
              Capability (optional)
            </label>
            <input
              id="capability"
              name="capability"
              list="caps"
              placeholder="any"
              className="h-10 w-40 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus/50"
            />
            <datalist id="caps">
              {CAPABILITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="budget" className="mb-1.5 block text-xs font-medium text-text-muted">
              Budget (HERMES)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="budget"
                name="budget"
                type="number"
                min="1"
                step="1"
                defaultValue="20"
                required
                className="h-10 w-24 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-focus/50"
              />
              <SubmitButton pendingLabel="Agent working…">
                <Bot className="size-4" aria-hidden />
                Run agent
              </SubmitButton>
            </div>
          </div>
        </form>
        <p className="mt-3 text-xs text-text-subtle">
          On-chain settlement can take up to ~90s. Spends above the auto-approve limit park in{" "}
          <Link href="/approvals" className="text-accent-soft hover:underline">
            Approvals
          </Link>
          .
        </p>
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-medium text-text-strong">Agent runs</h2>
        {runs.length === 0 ? (
          <EmptyState
            title="No agent runs yet"
            hint="Give the agent a goal above and watch it discover, decide, and settle autonomously."
          />
        ) : (
          <div className="space-y-4">
            {runs.map((run) => {
              const trace = run.trace as {
                goal?: string;
                budgetHermes?: number;
                decidedBy?: string;
                model?: string;
                steps?: AgentStep[];
              };
              const meta = STATUS_META[run.status] ?? STATUS_META.failed!;
              const StatusIcon = meta.icon;
              return (
                <Card key={run.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Bot className="size-4 text-accent-soft" aria-hidden />
                        <span className="font-medium text-text-strong">
                          {trace.goal ?? "Agent run"}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-subtle">
                        <Badge>{trace.decidedBy === "llm" ? `LLM${trace.model ? ` · ${trace.model}` : ""}` : "policy agent"}</Badge>
                        {trace.budgetHermes ? <span>budget {trace.budgetHermes} HERMES</span> : null}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.cls}`}>
                      <StatusIcon className="size-3.5" aria-hidden />
                      {meta.label}
                    </span>
                  </div>

                  <ol className="mt-4 space-y-3 border-l border-border pl-4">
                    {(trace.steps ?? []).map((step, i) => {
                      const Icon = STEP_ICON[step.kind] ?? Radar;
                      const explorerUrl = step.data?.explorerUrl as string | undefined;
                      const orderId = step.data?.orderId as string | undefined;
                      const tone =
                        step.kind === "error"
                          ? "text-danger"
                          : step.kind === "settle"
                            ? "text-success"
                            : "text-text-subtle";
                      return (
                        <li key={i} className="relative">
                          <span
                            className={`absolute -left-[22px] grid size-4 place-items-center rounded-full bg-surface ${tone}`}
                          >
                            <Icon className="size-3" aria-hidden />
                          </span>
                          <div className="text-sm text-text-strong">{step.label}</div>
                          {step.detail ? (
                            <div className="mt-0.5 font-mono text-xs break-all text-text-muted">
                              {step.detail}
                            </div>
                          ) : null}
                          <div className="mt-1 flex gap-3 text-xs">
                            {explorerUrl ? (
                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-accent-soft hover:underline"
                              >
                                cspr.live <ArrowUpRight className="size-3" aria-hidden />
                              </a>
                            ) : null}
                            {orderId ? (
                              <Link
                                href={`/orders/${orderId}`}
                                className="text-text-muted hover:text-text"
                              >
                                view order
                              </Link>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
