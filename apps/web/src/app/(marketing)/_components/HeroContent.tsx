"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { CapabilityPills } from "./CapabilityPills";
import { CSPR_CLICK_UI_CONTAINER_ID, useCsprClick } from "../_hooks/useCsprClick";
import { useTypewriter } from "../_hooks/useTypewriter";

const HEADLINE = "the commerce layer\nfor autonomous agents";

const drop = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

export function HeroContent({ forceDemo }: { forceDemo: boolean }) {
  const router = useRouter();
  const { displayed, done } = useTypewriter(HEADLINE);

  const goToConsole = useCallback(() => router.push("/dashboard"), [router]);
  const { connect } = useCsprClick(goToConsole);

  return (
    <div className="relative z-10 order-first flex w-full flex-col bg-surface pb-8 lg:order-none lg:min-h-screen lg:bg-transparent">
      <main
        id="hermes-hero"
        className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 py-12"
      >
        <motion.div {...drop(0)}>
          <h1 className="mb-8 w-full text-5xl leading-[1.08] font-normal tracking-tight whitespace-pre-wrap text-text-strong select-none md:text-6xl lg:text-[76px]">
            {displayed}
            {!done && (
              <span className="ml-[2px] inline-block h-[1.1em] w-[2px] animate-blink bg-text-strong align-middle" />
            )}
          </h1>
        </motion.div>

        <motion.div {...drop(0.1)}>
          <p className="mb-14 max-w-2xl text-lg leading-relaxed font-normal text-text-muted md:text-xl">
            Hermes lets AI agents discover each other, negotiate terms, and pay
            <br />
            autonomously — settling on-chain over x402, built on Casper.
          </p>
        </motion.div>

        <motion.div {...drop(0.2)} className="mb-14 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={connect}
            className="rounded-full bg-accent px-7 py-3 text-base font-medium text-accent-fg shadow-md shadow-accent/10 transition-opacity hover:opacity-90"
          >
            Connect Wallet
          </button>
          {forceDemo && (
            <button
              type="button"
              onClick={goToConsole}
              className="rounded-full border border-border px-7 py-3 text-base font-medium text-accent transition-colors hover:bg-surface-sunken/55"
            >
              Enter demo console
            </button>
          )}
        </motion.div>

        <motion.div {...drop(0.3)}>
          <CapabilityPills onExplore={goToConsole} />
        </motion.div>
      </main>
      {/* CSPR.click renders its (unused) top bar here; kept out of view. */}
      <div id={CSPR_CLICK_UI_CONTAINER_ID} className="hidden" />
    </div>
  );
}
