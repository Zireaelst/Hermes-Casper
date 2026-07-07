import { formatReputation } from "@hermes/shared";
import { AlertTriangle, ArrowUpRight, ExternalLink, RotateCw } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AmountText, Card, Mono, StatusBadge, SubmitButton } from "@/components/ui";
import { WorkflowCanvas } from "@/components/WorkflowCanvas";
import { retryOrder } from "@/lib/actions";
import { artifactsForOrder, loadData } from "@/lib/data";
import { deployUrl, shortHash } from "@/lib/explorer";

export const dynamic = "force-dynamic";

const STEPS = [
  { key: "quoted", label: "Quoted", detail: "Order created from listing terms" },
  { key: "authorized", label: "Authorized", detail: "Policy gate passed / approved" },
  { key: "settling", label: "Settling", detail: "Submitting transfer_with_authorization" },
  { key: "settled", label: "Settled", detail: "Deploy confirmed on Casper" },
] as const;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await loadData();
  const order = store.orders.find((o) => o.id === id);
  if (!order) notFound();

  const listing = store.listings.find((l) => l.id === order.listingId);
  const seller = store.agents.find((a) => a.id === order.sellerAgentId);
  const buyer = store.agents.find((a) => a.id === order.buyerAgentId);
  const payment = store.payments.find((p) => p.orderId === order.id);
  const receipt = payment ? store.receipts.find((r) => r.paymentId === payment.id) : undefined;
  const failed = order.status === "failed" || order.status === "cancelled";
  const currentStep = STEPS.findIndex((s) => s.key === order.status);

  // Surface the recorded failure reason (if any) for failed orders.
  let failureReason: string | undefined;
  if (order.status === "failed") {
    const arts = await artifactsForOrder(order.id);
    const errored = arts.find((a) => typeof a.metadata.error === "string");
    failureReason = errored ? String(errored.metadata.error) : undefined;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/orders"
          className="text-xs text-text-muted transition-colors hover:text-text"
        >
          ← Orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-strong">
              {listing?.title ?? "Order"}
            </h1>
            <p className="mt-1 font-mono text-xs text-text-subtle">{order.id}</p>
          </div>
          <div className="flex items-center gap-4">
            <AmountText amount={order.priceAmount} className="text-lg" />
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-2 text-xs font-medium tracking-wider text-text-subtle uppercase">
          Agent workflow
        </h2>
        <WorkflowCanvas orderStatus={order.status} paymentStatus={payment?.status} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-medium text-text-strong">Timeline</h2>
          <ol className="relative space-y-5 before:absolute before:top-1 before:bottom-1 before:left-[9px] before:w-px before:bg-border">
            {STEPS.map((step, i) => {
              const reached = !failed && currentStep >= i;
              const active = !failed && currentStep === i && step.key !== "settled";
              return (
                <li key={step.key} className="relative flex items-start gap-3.5 pl-0">
                  <span
                    className={`relative z-10 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[10px] ${
                      reached
                        ? "border-success/60 bg-success/15 text-success"
                        : "border-border bg-surface text-text-subtle"
                    } ${active ? "animate-pulse" : ""}`}
                  >
                    {reached ? "✓" : i + 1}
                  </span>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-medium ${reached ? "text-text-strong" : "text-text-muted"}`}
                    >
                      {step.label}
                      {step.key === "settled" && receipt ? (
                        <span className="ml-2 text-xs font-normal text-text-subtle">
                          {new Date(receipt.settledAt).toLocaleTimeString()}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-text-subtle">{step.detail}</p>
                  </div>
                </li>
              );
            })}
            {failed ? (
              <li className="relative flex items-start gap-3.5">
                <span className="relative z-10 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-danger/60 bg-danger/15 text-[10px] text-danger">
                  ✕
                </span>
                <div className="text-sm font-medium text-danger capitalize">{order.status}</div>
              </li>
            ) : null}
          </ol>

          {order.status === "authorized" ? (
            <div className="mt-5 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              Waiting for human approval —{" "}
              <Link href="/approvals" className="font-medium underline underline-offset-2">
                review in Approvals
              </Link>
              .
            </div>
          ) : null}

          {order.status === "failed" ? (
            <div className="mt-5 rounded-lg border border-danger/40 bg-danger/10 p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-danger">Settlement didn&apos;t complete</p>
                  <p className="mt-1 text-xs text-text-muted">
                    {failureReason
                      ? failureReason
                      : "The payment could not be settled. If running on-chain, ensure the facilitator is reachable, then retry."}
                  </p>
                  <form action={retryOrder} className="mt-3">
                    <input type="hidden" name="orderId" value={order.id} />
                    <SubmitButton size="sm" variant="danger" pendingLabel="Retrying…">
                      <RotateCw className="size-3.5" aria-hidden />
                      Retry settlement
                    </SubmitButton>
                  </form>
                </div>
              </div>
            </div>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="text-xs font-medium tracking-wider text-text-subtle uppercase">
              Parties
            </h2>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Buyer</span>
                <span className="font-medium text-text-strong">
                  {buyer?.displayName ?? "Research Agent"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Seller</span>
                <span className="text-right font-medium text-text-strong">
                  {seller?.displayName}
                  {seller ? (
                    <span className="ml-2 text-xs font-normal text-text-subtle">
                      {formatReputation(store.reputation[seller.id] ?? 0)}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>
          </Card>

          {receipt ? (
            <Card className="border-success/30 bg-success/[0.03]">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-medium tracking-wider text-success uppercase">
                  Receipt
                </h2>
                <a
                  href={deployUrl(receipt.deployHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent-soft hover:underline"
                >
                  cspr.live
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              </div>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-text-muted">Deploy hash</dt>
                  <dd className="mt-1">
                    <a
                      href={deployUrl(receipt.deployHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 font-mono text-xs text-text hover:text-accent-soft"
                    >
                      {shortHash(receipt.deployHash, 10, 8)}
                      <ArrowUpRight className="size-3 text-text-subtle" aria-hidden />
                    </a>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-text-muted">Amount</dt>
                  <dd>
                    <AmountText amount={receipt.amount} className="text-sm" />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-text-muted">Settled</dt>
                  <dd className="text-text">{new Date(receipt.settledAt).toLocaleString()}</dd>
                </div>
              </dl>
            </Card>
          ) : payment ? (
            <Card>
              <h2 className="text-xs font-medium tracking-wider text-text-subtle uppercase">
                Payment
              </h2>
              <div className="mt-3 flex items-center justify-between text-sm">
                <StatusBadge status={payment.status} />
                <Mono>{payment.nonce.slice(0, 16)}…</Mono>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
