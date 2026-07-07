import { formatAmount } from "@hermes/shared";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/ui";
import { loadData } from "@/lib/data";
import { deployUrl, shortHash } from "@/lib/explorer";

interface ReceiptView {
  deployHash: string;
  amount: string;
  live: boolean;
}

// A representative receipt shown only when no real settlement exists yet.
const SAMPLE: ReceiptView = {
  deployHash: "66151d1109a2b8c4f0e7a1d3b5c9e2f4a6b8d0c2e4f6a8b0c2d4e6f8a0b2c4ef95bf",
  amount: "7500000000",
  live: false,
};

/** Trust section — explains real x402 settlement and shows the latest Receipt. */
export async function OnChain() {
  let receipt: ReceiptView = SAMPLE;
  try {
    const data = await loadData();
    const latest = [...data.receipts].sort(
      (a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime(),
    )[0];
    if (latest) receipt = { deployHash: latest.deployHash, amount: latest.amount, live: true };
  } catch {
    // Landing must never break on a data-source hiccup — fall back to the sample.
  }

  return (
    <section id="on-chain" className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <p className="text-sm font-medium tracking-wider text-accent-soft uppercase">
            Real settlement
          </p>
          <h2 className="mt-3 text-3xl font-normal tracking-tight text-text-strong sm:text-4xl">
            Money moves on-chain — not in a screenshot.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-text-muted">
            Payments settle with{" "}
            <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-sm text-text">
              transfer_with_authorization
            </code>{" "}
            on Casper: the buyer agent signs an EIP-712 authorization, a facilitator submits the
            deploy, and the CEP-18 balance actually moves. Every settlement is verifiable on a
            public block explorer.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "EIP-712 authorization signed by the paying agent",
              "Exactly-once settlement, idempotent on the nonce",
              "Deploy hash anchored to an auditable Receipt",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-text">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-2xl border border-border bg-surface-raised p-6 shadow-card">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-medium tracking-wider text-success uppercase">
                <CheckCircle2 className="size-4" aria-hidden />
                Settled
              </span>
              <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 font-mono text-xs text-text-muted">
                casper-test
              </span>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-text-muted">Amount</dt>
                <dd className="mt-1 font-mono text-2xl tabular-nums text-text-strong">
                  {formatAmount(receipt.amount, 9)}{" "}
                  <span className="text-base text-text-muted">HERMES</span>
                </dd>
              </div>
              <div className="rule-fade" />
              <div>
                <dt className="text-text-muted">Deploy hash</dt>
                <dd className="mt-1">
                  <a
                    href={deployUrl(receipt.deployHash)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-sm text-accent-soft underline-offset-4 hover:underline"
                  >
                    {shortHash(receipt.deployHash, 12, 8)}
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </a>
                </dd>
              </div>
            </dl>

            <p className="mt-5 text-xs text-text-subtle">
              {receipt.live
                ? "Latest settlement recorded by Hermes."
                : "Illustrative receipt — connect a wallet to settle your own."}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
