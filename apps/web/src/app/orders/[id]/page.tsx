import Link from "next/link";
import { notFound } from "next/navigation";
import { AmountText, Card, Mono, PageHeader, StatusBadge } from "@/components/ui";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const STEPS = ["quoted", "authorized", "settling", "settled"] as const;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const store = getStore();
  const order = store.orders.find((o) => o.id === id);
  if (!order) notFound();

  const listing = store.listings.find((l) => l.id === order.listingId);
  const seller = store.agents.find((a) => a.id === order.sellerAgentId);
  const payment = store.payments.find((p) => p.orderId === order.id);
  const receipt = payment
    ? store.receipts.find((r) => r.paymentId === payment.id)
    : undefined;
  const failed = order.status === "failed" || order.status === "cancelled";
  const currentStep = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <>
      <PageHeader title={listing?.title ?? "Order"} sub={`Order ${order.id}`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <StatusBadge status={order.status} />
            <AmountText amount={order.priceAmount} className="text-lg" />
          </div>

          {/* Order timeline */}
          <ol className="space-y-3">
            {STEPS.map((step, i) => {
              const reached = !failed && currentStep >= i;
              const active = !failed && currentStep === i && step !== "settled";
              return (
                <li key={step} className="flex items-center gap-3">
                  <span
                    className={`grid size-5 place-items-center rounded-full border text-[10px] ${
                      reached
                        ? "border-success/60 bg-success/15 text-success"
                        : "border-border text-text-muted"
                    } ${active ? "animate-pulse" : ""}`}
                  >
                    {reached ? "✓" : i + 1}
                  </span>
                  <span
                    className={`font-mono text-sm ${reached ? "" : "text-text-muted"}`}
                  >
                    {step}
                  </span>
                  {step === "settled" && receipt ? (
                    <span className="text-xs text-text-muted">
                      {new Date(receipt.settledAt).toLocaleTimeString()}
                    </span>
                  ) : null}
                </li>
              );
            })}
            {failed ? (
              <li className="flex items-center gap-3">
                <span className="grid size-5 place-items-center rounded-full border border-danger/60 bg-danger/15 text-[10px] text-danger">
                  ✕
                </span>
                <span className="font-mono text-sm text-danger">{order.status}</span>
              </li>
            ) : null}
          </ol>

          {order.status === "authorized" ? (
            <div className="mt-5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              Waiting for human approval —{" "}
              <Link href="/approvals" className="underline underline-offset-2">
                review in Approvals
              </Link>
              .
            </div>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-text-muted">Parties</div>
            <div className="mt-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Buyer</span> Research Agent
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted">Seller</span> {seller?.displayName}
              </div>
            </div>
          </Card>

          {receipt ? (
            <Card className="border-success/30">
              <div className="text-xs uppercase tracking-wider text-success">Receipt</div>
              <dl className="mt-2 space-y-2 text-sm">
                <div>
                  <dt className="text-text-muted">Deploy hash</dt>
                  <dd>
                    <Mono>{receipt.deployHash}</Mono>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Amount</dt>
                  <dd>
                    <AmountText amount={receipt.amount} className="text-sm" />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Settled</dt>
                  <dd>{new Date(receipt.settledAt).toLocaleString()}</dd>
                </div>
              </dl>
            </Card>
          ) : payment ? (
            <Card>
              <div className="text-xs uppercase tracking-wider text-text-muted">Payment</div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <StatusBadge status={payment.status} />
                <Mono>{payment.nonce.slice(0, 16)}…</Mono>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
