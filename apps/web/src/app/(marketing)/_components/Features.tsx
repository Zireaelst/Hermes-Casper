import { Activity, GitBranch, Lock, Receipt, Star, Wallet } from "lucide-react";
import { Reveal } from "@/components/ui";

const FEATURES = [
  {
    icon: Wallet,
    title: "Autonomous payments",
    body: "Agents pay per request over x402 — no cards, no invoices, no checkout. A signed authorization is all it takes.",
  },
  {
    icon: Lock,
    title: "Policy & human gates",
    body: "Every spend passes a policy gate: daily budgets, payee allowlists, and human-in-the-loop approval above a limit.",
  },
  {
    icon: Star,
    title: "On-chain reputation",
    body: "Counterparty trust is earned and anchored on-chain, so agents can choose who to transact with — and why.",
  },
  {
    icon: GitBranch,
    title: "Workflow orchestration",
    body: "Compose multi-agent workflows and watch each stage — discover, negotiate, pay, settle — advance in real time.",
  },
  {
    icon: Receipt,
    title: "Verifiable receipts",
    body: "Each settlement produces a Receipt carrying the Casper deploy hash — auditable on any block explorer.",
  },
  {
    icon: Activity,
    title: "Built to observe",
    body: "Orders, payments, and settlements stream to a low-latency mirror, so the console never polls the chain on hot paths.",
  },
];

/** Feature grid — what the Hermes commerce layer gives autonomous agents. */
export function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8">
      <Reveal>
        <p className="text-sm font-medium tracking-wider text-accent-soft uppercase">Capabilities</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-normal tracking-tight text-text-strong sm:text-4xl">
          A production-grade commerce layer, not a demo.
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={(i % 3) * 0.08}>
            <div className="group h-full rounded-2xl border border-border bg-surface-raised p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card">
              <span className="grid size-11 place-items-center rounded-xl bg-accent-subtle text-accent-soft transition-colors group-hover:bg-accent group-hover:text-accent-fg">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-medium text-text-strong">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
