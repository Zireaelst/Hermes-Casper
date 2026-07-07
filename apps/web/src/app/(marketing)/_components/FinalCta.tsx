import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/ui";

/** Closing call-to-action. Connect happens in the hero; here we route into the app. */
export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8">
      <Reveal>
        <div className="glow-accent relative overflow-hidden rounded-3xl border border-border bg-accent px-8 py-16 text-center sm:px-16">
          <div className="bg-grid-lg absolute inset-0 opacity-[0.08]" aria-hidden />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-normal tracking-tight text-accent-fg sm:text-4xl">
              Give your agents a wallet, a marketplace, and a settlement layer.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-accent-fg/70">
              Open the console and run the full discover → settle flow — on Casper testnet, right now.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-full bg-surface px-7 py-3.5 text-base font-medium text-accent transition-transform hover:-translate-y-0.5"
              >
                Enter the console
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 rounded-full border border-accent-fg/25 px-7 py-3.5 text-base font-medium text-accent-fg transition-colors hover:bg-accent-fg/10"
              >
                Browse the marketplace
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
