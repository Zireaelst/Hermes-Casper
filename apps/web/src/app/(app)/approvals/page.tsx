import { ShieldCheck } from "lucide-react";
import { AmountText, Card, EmptyState, PageHeader, Reveal, SubmitButton } from "@/components/ui";
import { approveSpend, rejectSpend } from "@/lib/actions";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const store = await loadData();

  return (
    <div className="space-y-6">
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
          {store.approvals.map((approval, i) => {
            const order = store.orders.find((o) => o.id === approval.orderId);
            const listing = order
              ? store.listings.find((l) => l.id === order.listingId)
              : undefined;
            const seller = order
              ? store.agents.find((a) => a.id === order.sellerAgentId)
              : undefined;
            if (!order) return null;
            return (
              <Reveal key={approval.orderId} delay={i * 0.05}>
                <Card className="border-warning/40 bg-warning/[0.03]">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning">
                        <ShieldCheck className="size-4" aria-hidden />
                      </span>
                      <div>
                        <div className="font-medium text-text-strong">
                          {listing?.title ?? "Order"}
                        </div>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {seller?.displayName ? `${seller.displayName} · ` : ""}
                          {approval.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <AmountText amount={order.priceAmount} />
                      <form action={approveSpend}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <SubmitButton size="sm" variant="success" pendingLabel="Approving…">
                          Approve
                        </SubmitButton>
                      </form>
                      <form action={rejectSpend}>
                        <input type="hidden" name="orderId" value={order.id} />
                        <SubmitButton size="sm" variant="danger" pendingLabel="Rejecting…">
                          Reject
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
