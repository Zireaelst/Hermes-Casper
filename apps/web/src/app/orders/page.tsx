import Link from "next/link";
import { AmountText, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function OrdersPage() {
  const store = getStore();

  return (
    <>
      <PageHeader title="Orders" sub="Every agreement your agents have entered." />
      {store.orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          hint="Orders appear here once an agent accepts terms in the marketplace."
        />
      ) : (
        <Card className="divide-y divide-border p-0">
          {store.orders.map((order) => {
            const listing = store.listings.find((l) => l.id === order.listingId);
            const seller = store.agents.find((a) => a.id === order.sellerAgentId);
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-hover"
              >
                <div>
                  <div className="text-sm font-medium">{listing?.title ?? "Order"}</div>
                  <div className="mt-0.5 text-xs text-text-muted">
                    seller {seller?.displayName} ·{" "}
                    <span className="font-mono">{order.id.slice(0, 8)}</span>
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
