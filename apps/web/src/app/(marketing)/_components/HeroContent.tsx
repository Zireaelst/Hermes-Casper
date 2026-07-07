"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { CSPR_CLICK_UI_CONTAINER_ID, useCsprClick } from "../_hooks/useCsprClick";
import { useTypewriter } from "../_hooks/useTypewriter";

const HEADLINE = "the commerce layer\nfor autonomous agents";

const TRUST = ["Built on Casper", "x402 native", "On-chain settlement", "CEP-18 payments"];

export function HeroContent({ forceDemo }: { forceDemo: boolean }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const { displayed, done } = useTypewriter(HEADLINE);

  const goToConsole = useCallback(() => router.push("/dashboard"), [router]);
  const { connect } = useCsprClick(goToConsole);

  const drop = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.2, 0.8, 0.2, 1] as const },
        };

  return (
    <div className="relative z-10 order-first flex w-full flex-col bg-surface pb-10 lg:order-none lg:min-h-screen lg:bg-transparent">
      <div
        id="hermes-hero"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pt-32 pb-16 sm:px-8"
      >
        <div className="max-w-2xl">
          <motion.div {...drop(0)}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium text-text-muted backdrop-blur-sm">
              <span className="relative flex size-1.5">
                <span className="animate-ping-soft absolute inline-flex size-full rounded-full bg-success/70" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              Live on Casper testnet
            </span>
          </motion.div>

          <motion.h1
            {...drop(0.05)}
            className="mt-6 text-5xl leading-[1.05] font-normal tracking-tight text-text-strong sm:text-6xl lg:text-[76px]"
          >
            <span className="whitespace-pre-wrap select-none">{displayed}</span>
            {!done && (
              <span className="ml-[2px] inline-block h-[0.9em] w-[3px] animate-blink bg-text-strong align-middle" />
            )}
          </motion.h1>

          <motion.p
            {...drop(0.15)}
            className="mt-7 max-w-xl text-lg leading-relaxed text-text-muted sm:text-xl"
          >
            Hermes lets AI agents discover each other, negotiate terms, and pay autonomously —
            settling on-chain over the <span className="text-text">x402</span> protocol, built on{" "}
            <span className="text-text">Casper</span>.
          </motion.p>

          <motion.div {...drop(0.25)} className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={connect}
              className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-accent-fg shadow-pop transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Connect Wallet
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/60 px-7 py-3.5 text-base font-medium text-text backdrop-blur-sm transition-colors hover:bg-surface-hover"
            >
              See how it works
            </a>
            {forceDemo && (
              <button
                type="button"
                onClick={goToConsole}
                className="inline-flex items-center gap-2 px-4 py-3.5 text-base font-medium text-accent-soft underline-offset-4 transition-colors hover:underline"
              >
                Enter demo console
              </button>
            )}
          </motion.div>

          <motion.ul
            {...drop(0.35)}
            className="mt-14 flex flex-wrap gap-x-6 gap-y-3 text-sm text-text-subtle"
          >
            {TRUST.map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <span className="size-1 rounded-full bg-accent-soft" aria-hidden />
                {t}
              </li>
            ))}
          </motion.ul>
        </div>
      </div>

      {/* CSPR.click renders its (unused) top bar here; kept out of view. */}
      <div id={CSPR_CLICK_UI_CONTAINER_ID} className="hidden" />
    </div>
  );
}
