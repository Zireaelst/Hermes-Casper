import { AmountText, Card, EmptyState, PageHeader } from "@/components/ui";
import { approveSpend, rejectSpend } from "@/lib/actions";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function ApprovalsPage() {
  const store = getStore();

  return (
    <>
      <PageHeader
        title="Approvals"
        sub="Spends above the auto-approve limit wait here for a human decision (HITL)."
      />
      {store.approvals.length === 0 ? (
        <EmptyState
          title="No pending approvals"
          hint="When an agent tries to spend more than its auto-approve limit, the run pauses and the request appears here."
        />
      ) : (
        <div className="space-y-4">
          {store.approvals.map((approval) => {
            const order = store.orders.find((o) => o.id === approval.orderId);
            const listing = order
              ? store.listings.find((l) => l.id === order.listingId)
              : undefined;
            if (!order) return null;
            return (
              <Card key={approval.orderId} className="border-warning/40">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{listing?.title ?? "Order"}</div>
                    <p className="mt-1 max-w-md text-xs text-text-muted">{approval.reason}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <AmountText amount={order.priceAmount} />
                    <form action={approveSpend}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button
                        type="submit"
                        className="rounded-lg bg-success px-3.5 py-1.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectSpend}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-danger/50 px-3.5 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
