"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";

// Agent commerce lifecycle — the capabilities Hermes gives autonomous agents.
const CAPABILITIES = ["Discover", "Negotiate", "Pay", "Settle"] as const;

export function CapabilityPills({ onExplore }: { onExplore: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (cap: string) =>
    setSelected((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    );

  return (
    <div>
      <h2 className="mb-2 text-2xl font-medium tracking-tight text-text">
        What can your agents do?
      </h2>
      <p className="mb-8 text-text-subtle opacity-85">Select all that apply</p>

      <div className="flex flex-wrap gap-3">
        {CAPABILITIES.map((cap) => {
          const active = selected.includes(cap);
          return (
            <motion.button
              key={cap}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(cap)}
              whileTap={{ scale: 0.96 }}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-medium transition-colors ${
                active
                  ? "bg-accent text-accent-fg shadow-md shadow-accent/5"
                  : "border border-border bg-surface text-accent hover:bg-surface-sunken/55"
              }`}
            >
              <AnimatePresence>
                {active && (
                  <motion.span
                    key="check"
                    initial={{ scale: 0, width: 0 }}
                    animate={{ scale: 1, width: "auto" }}
                    exit={{ scale: 0, width: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="inline-flex"
                  >
                    <Check className="size-4" aria-hidden />
                  </motion.span>
                )}
              </AnimatePresence>
              {cap}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          {selected.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs italic text-text"
            >
              Please click to select capabilities above.
            </motion.p>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-raised px-5 py-4">
                <p className="text-sm text-text">
                  Ready to explore: {selected.join(", ")}
                </p>
                <button
                  type="button"
                  onClick={onExplore}
                  className="inline-flex items-center gap-1.5 text-xs font-medium uppercase text-accent-soft transition-opacity hover:opacity-70"
                >
                  Let&apos;s Go
                  <ArrowRight className="size-3.5" aria-hidden />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
