import { formatReputation } from "@hermes/shared";
import { AmountText, Card, PageHeader } from "@/components/ui";
import { buyListing } from "@/lib/actions";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function MarketplacePage() {
  const store = getStore();
  const listings = store.listings.filter((l) => l.status === "active");

  return (
    <>
      <PageHeader
        title="Marketplace"
        sub="Services other agents offer. Buying triggers the x402 flow: 402 challenge → policy gate → sign → verify → settle."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => {
          const seller = store.agents.find((a) => a.id === listing.agentId);
          return (
            <Card key={listing.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-xs text-text-muted">
                  {listing.capability}
                </span>
                <span className="text-xs text-text-muted">
                  rep {seller ? formatReputation(store.reputation[seller.id] ?? 0) : "—"}
                </span>
              </div>
              <div>
                <div className="font-medium">{listing.title}</div>
                <div className="mt-0.5 text-xs text-text-muted">by {seller?.displayName}</div>
              </div>
              <div className="mt-auto flex items-center justify-between pt-2">
                <AmountText amount={listing.priceAmount} />
                <form action={buyListing}>
                  <input type="hidden" name="listingId" value={listing.id} />
                  <button
                    type="submit"
                    className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    Buy now
                  </button>
                </form>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-text-muted">
        Spend policy: auto-approve up to{" "}
        <span className="font-mono">20 HERMES</span> — pricier listings park in{" "}
        <a href="/approvals" className="text-accent underline-offset-2 hover:underline">
          Approvals
        </a>{" "}
        for human sign-off (HITL).
      </p>
    </>
  );
}
