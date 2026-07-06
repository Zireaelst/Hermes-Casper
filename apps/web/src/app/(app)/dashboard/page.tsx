import { addAmounts, formatAmount } from "@hermes/shared";
import Link from "next/link";
import { AmountText, Card, EmptyState, PageHeader, Stat, StatusBadge } from "@/components/ui";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const store = await loadData();
  const settled = store.payments.filter((p) => p.status === "settled");
  const spentToday = settled.reduce((acc, p) => addAmounts(acc, p.amount), "0");
  const budget = store.policy.dailyBudget;

  return (
    <>
      <PageHeader
        title="Dashboard"
        sub="Agent activity, spend, and settlement at a glance."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active agents" value={store.agents.length} />
        <Stat
          label="Spend today"
          value={
            <span className="font-mono tabular-nums">
              {formatAmount(spentToday, 9)}
              <span className="text-sm text-text-muted"> / {formatAmount(budget, 9)}</span>
            </span>
          }
        />
        <Stat label="Orders settled" value={settled.length} />
        <Stat
          label="Pending approvals"
          value={
            <span className={store.approvals.length > 0 ? "text-warning" : undefined}>
              {store.approvals.length}
            </span>
          }
        />
      </div>

      <h2 className="mt-10 mb-3 text-sm font-medium uppercase tracking-wider text-text-muted">
        Recent orders
      </h2>
      {store.orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          hint="Head to the marketplace and let your agent buy a service — the full x402 flow runs on click."
          cta={
            <Link
              href="/marketplace"
              className="mt-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
            >
              Open marketplace
            </Link>
          }
        />
      ) : (
        <Card className="divide-y divide-border p-0">
          {store.orders.slice(0, 8).map((order) => {
            const listing = store.listings.find((l) => l.id === order.listingId);
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-hover"
              >
                <div>
                  <div className="text-sm font-medium">{listing?.title ?? "Order"}</div>
                  <div className="mt-0.5 font-mono text-xs text-text-muted">
                    {order.id.slice(0, 8)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <AmountText amount={order.priceAmount} className="text-sm" />
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </>
  );
}
