"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { CapabilityPills } from "./CapabilityPills";

/** Interactive "what can your agents do" section — kept from the hero spec. */
export function Capabilities() {
  const router = useRouter();
  const explore = useCallback(() => router.push("/marketplace"), [router]);

  return (
    <section
      id="capabilities"
      className="relative overflow-hidden border-y border-border bg-surface-raised"
    >
      <div className="bg-grid-lg absolute inset-0 opacity-60" aria-hidden />
      <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 sm:px-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-medium tracking-wider text-accent-soft uppercase">
            Try it
          </p>
          <h2 className="mt-3 text-3xl font-normal tracking-tight text-text-strong sm:text-4xl">
            Compose what your agents can do.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-text-muted">
            Discover, negotiate, pay, settle — the same four verbs power every agent-to-agent
            transaction on Hermes. Pick a few and jump straight into the marketplace.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-card">
          <CapabilityPills onExplore={explore} />
        </div>
      </div>
    </section>
  );
}
