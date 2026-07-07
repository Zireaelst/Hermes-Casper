import { addAmounts, formatAmount, formatReputation } from "@hermes/shared";
import { ArrowRight, CheckCircle2, Clock, ShoppingBag, Users, Wallet } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { AmountText, Card, EmptyState, Meter, StatusBadge } from "@/components/ui";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

function StatCard({
  icon,
  label,
  value,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wider text-text-subtle uppercase">
          {label}
        </span>
        <span className="grid size-8 place-items-center rounded-lg bg-accent-subtle text-accent-soft">
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-text-strong">{value}</div>
      {children}
    </Card>
  );
}

export default async function DashboardPage() {
  const store = await loadData();
  const settled = store.payments.filter((p) => p.status === "settled");
  const spentToday = settled.reduce((acc, p) => addAmounts(acc, p.amount), "0");
  const budget = store.policy.dailyBudget;
  const ratio = Number(spentToday) / Math.max(1, Number(budget));
  const tone = ratio > 0.9 ? "danger" : ratio > 0.7 ? "warning" : "accent";

  const topAgents = [...store.agents]
    .sort((a, b) => (store.reputation[b.id] ?? 0) - (store.reputation[a.id] ?? 0))
    .slice(0, 3);

  const recent = store.orders.slice(0, 6);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-strong">Dashboard</h1>
          <p className="mt-1 text-sm text-text-muted">
            Agent activity, spend, and settlement at a glance.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="group inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-transform hover:-translate-y-0.5"
        >
          <ShoppingBag className="size-4" aria-hidden />
          Buy a service
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Users className="size-4" aria-hidden />} label="Active agents" value={store.agents.length} />
        <StatCard
          icon={<Wallet className="size-4" aria-hidden />}
          label="Spend today"
          value={
            <span className="font-mono tabular-nums">
              {formatAmount(spentToday, 9)}
              <span className="text-sm text-text-muted"> / {formatAmount(budget, 9)}</span>
            </span>
          }
        >
          <Meter value={ratio} tone={tone} className="mt-3" label="Daily budget used" />
        </StatCard>
        <StatCard
          icon={<CheckCircle2 className="size-4" aria-hidden />}
          label="Orders settled"
          value={settled.length}
        />
        <StatCard
          icon={<Clock className="size-4" aria-hidden />}
          label="Pending approvals"
          value={
            <span className={store.approvals.length > 0 ? "text-warning" : undefined}>
              {store.approvals.length}
            </span>
          }
        >
          {store.approvals.length > 0 ? (
            <Link
              href="/approvals"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-warning hover:underline"
            >
              Review now <ArrowRight className="size-3" aria-hidden />
            </Link>
          ) : null}
        </StatCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-text-strong">Recent orders</h2>
            <Link href="/orders" className="text-xs text-text-muted hover:text-text">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              title="No orders yet"
              hint="Head to the marketplace and let your agent buy a service — the full x402 flow runs on click."
              cta={
                <Link
                  href="/marketplace"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
                >
                  Open marketplace
                </Link>
              }
            />
          ) : (
            <Card className="divide-y divide-border p-0">
              {recent.map((order) => {
                const listing = store.listings.find((l) => l.id === order.listingId);
                const seller = store.agents.find((a) => a.id === order.sellerAgentId);
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-surface-hover"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-text-strong">
                        {listing?.title ?? "Order"}
                      </div>
                      <div className="mt-0.5 text-xs text-text-muted">
                        {seller?.displayName} ·{" "}
                        <span className="font-mono">{order.id.slice(0, 8)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <AmountText amount={order.priceAmount} className="text-sm" />
                      <StatusBadge status={order.status} />
                    </div>
                  </Link>
                );
              })}
            </Card>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-text-strong">Top agents</h2>
            <Link href="/marketplace" className="text-xs text-text-muted hover:text-text">
              Marketplace
            </Link>
          </div>
          <Card className="space-y-1 p-2">
            {topAgents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              >
                <span className="grid size-8 place-items-center rounded-lg bg-accent-subtle text-xs font-semibold text-accent-soft">
                  {agent.displayName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-text-strong">
                    {agent.displayName}
                  </div>
                  <div className="truncate font-mono text-xs text-text-subtle">
                    {agent.capabilities[0]}
                  </div>
                </div>
                <span className="shrink-0 text-sm text-text-muted">
                  {formatReputation(store.reputation[agent.id] ?? 0)}
                </span>
              </div>
            ))}
          </Card>

          <div className="mt-4 rounded-xl border border-border bg-surface-raised p-4">
            <p className="text-xs text-text-muted">
              Auto-approve limit
              <span className="ml-1 font-mono text-text">
                {formatAmount(store.policy.autoApproveLimit, 9)} HERMES
              </span>
            </p>
            <p className="mt-1.5 text-xs text-text-subtle">
              Spends above this pause for human sign-off in{" "}
              <Link href="/approvals" className="text-accent-soft hover:underline">
                Approvals
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
