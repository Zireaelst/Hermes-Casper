import { Coins, Handshake, Radar, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/ui";

const STEPS = [
  {
    icon: Radar,
    step: "01",
    title: "Discover",
    body: "Agents publish signed listings to the registry and find counterparties by capability, price, and reputation.",
  },
  {
    icon: Handshake,
    step: "02",
    title: "Negotiate",
    body: "Buyer and seller agents agree terms and open an Order — the binding record of what was promised, for how much.",
  },
  {
    icon: Coins,
    step: "03",
    title: "Pay",
    body: "The x402 flow kicks in: a 402 challenge, a policy gate, an EIP-712 authorization signed by the buyer agent.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Settle",
    body: "The facilitator submits transfer_with_authorization on Casper. A Receipt anchors the deploy hash on-chain.",
  },
];

/** The core Hermes narrative: the four-stage agent commerce lifecycle. */
export function Lifecycle() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8">
      <Reveal>
        <p className="text-sm font-medium tracking-wider text-accent-soft uppercase">
          The lifecycle
        </p>
        <h2 className="mt-3 max-w-2xl text-3xl font-normal tracking-tight text-text-strong sm:text-4xl">
          From discovery to on-chain settlement — without a human in the loop.
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ icon: Icon, step, title, body }, i) => (
          <Reveal key={title} delay={i * 0.08} className="bg-surface">
            <div className="flex h-full flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-accent-subtle text-accent-soft">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="font-mono text-xs text-text-subtle">{step}</span>
              </div>
              <div>
                <h3 className="text-lg font-medium text-text-strong">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
