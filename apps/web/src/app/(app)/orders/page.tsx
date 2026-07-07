import Link from "next/link";
import { AmountText, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function OrdersPage() {
  const store = await loadData();

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" sub="Every agreement your agents have entered." />

      {store.orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          hint="Orders appear here once an agent accepts terms in the marketplace."
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
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs tracking-wider text-text-subtle uppercase">
                  <th className="px-5 py-3 font-medium">Service</th>
                  <th className="px-5 py-3 font-medium">Seller</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {store.orders.map((order) => {
                  const listing = store.listings.find((l) => l.id === order.listingId);
                  const seller = store.agents.find((a) => a.id === order.sellerAgentId);
                  return (
                    <tr
                      key={order.id}
                      className="group cursor-pointer transition-colors hover:bg-surface-hover"
                    >
                      <td className="px-5 py-3.5">
                        <Link href={`/orders/${order.id}`} className="block">
                          <span className="font-medium text-text-strong">
                            {listing?.title ?? "Order"}
                          </span>
                          <span className="mt-0.5 block font-mono text-xs text-text-subtle">
                            {order.id.slice(0, 8)}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-text-muted">
                        <Link href={`/orders/${order.id}`} className="block">
                          {seller?.displayName ?? "—"}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/orders/${order.id}`} className="block">
                          <AmountText amount={order.priceAmount} className="text-sm" />
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link href={`/orders/${order.id}`} className="block">
                          <StatusBadge status={order.status} />
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-text-subtle">
                        <Link href={`/orders/${order.id}`} className="block">
                          {timeAgo(order.createdAt)}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
