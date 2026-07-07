const STACK = [
  "Casper Network",
  "Odra Contracts",
  "x402 Protocol",
  "CEP-18 Tokens",
  "CSPR.click",
  "Supabase",
  "transfer_with_authorization",
  "LangGraph",
];

/** Infinite marquee of the technologies Hermes is built on. */
export function TrustBar() {
  return (
    <section aria-label="Built with" className="border-y border-border bg-surface-raised py-6">
      <div className="marquee-mask overflow-hidden">
        <div className="animate-marquee flex w-max items-center gap-12 pr-12">
          {[...STACK, ...STACK].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex shrink-0 items-center gap-3 text-sm font-medium tracking-tight text-text-subtle"
            >
              <span className="size-1.5 rounded-full bg-accent-soft/60" aria-hidden />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
