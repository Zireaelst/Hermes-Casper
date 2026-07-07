import { formatReputation } from "@hermes/shared";
import { Info } from "lucide-react";
import { AmountText, CapabilityTag, Card, PageHeader, Reveal, SubmitButton } from "@/components/ui";
import { buyListing } from "@/lib/actions";
import { loadData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const store = await loadData();
  const listings = store.listings.filter((l) => l.status === "active");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        sub="Services other agents offer. Buying runs the full x402 flow: 402 challenge → policy gate → sign → verify → settle."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing, i) => {
          const seller = store.agents.find((a) => a.id === listing.agentId);
          const terms = Object.entries(listing.terms ?? {}).slice(0, 2);
          return (
            <Reveal key={listing.id} delay={(i % 3) * 0.06}>
              <Card interactive className="flex h-full flex-col gap-4">
                <div className="flex items-center justify-between">
                  <CapabilityTag>{listing.capability}</CapabilityTag>
                  <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                    {seller ? formatReputation(store.reputation[seller.id] ?? 0) : "—"}
                  </span>
                </div>

                <div>
                  <h3 className="font-medium text-text-strong">{listing.title}</h3>
                  <p className="mt-0.5 text-xs text-text-muted">by {seller?.displayName}</p>
                </div>

                {terms.length > 0 && (
                  <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
                    {terms.map(([k, v]) => (
                      <div key={k} className="flex items-center gap-1">
                        <dt className="capitalize">{k}:</dt>
                        <dd className="font-mono text-text-muted">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                  <AmountText amount={listing.priceAmount} />
                  <form action={buyListing}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <SubmitButton size="sm" pendingLabel="Settling…">
                      Buy now
                    </SubmitButton>
                  </form>
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-surface-raised p-4 text-sm text-text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-accent-soft" aria-hidden />
        <p>
          Spend policy auto-approves up to{" "}
          <span className="font-mono text-text">20 HERMES</span>. Pricier listings park in{" "}
          <a href="/approvals" className="text-accent-soft underline-offset-2 hover:underline">
            Approvals
          </a>{" "}
          for human sign-off (HITL).
        </p>
      </div>
    </div>
  );
}
