import type { OrderStatus, PaymentStatus } from "@hermes/types";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Canonical status → color mapping (design-system.md §6). */
const STATUS_COLOR: Record<string, string> = {
  quoted: "text-info border-info/30 bg-info/10",
  verifying: "text-info border-info/30 bg-info/10",
  pending: "text-info border-info/30 bg-info/10",
  authorized: "text-warning border-warning/30 bg-warning/10",
  settling: "text-warning border-warning/30 bg-warning/10",
  "waiting-hitl": "text-warning border-warning/30 bg-warning/10",
  settled: "text-success border-success/30 bg-success/10",
  done: "text-success border-success/30 bg-success/10",
  active: "text-success border-success/30 bg-success/10",
  failed: "text-danger border-danger/30 bg-danger/10",
  expired: "text-danger border-danger/30 bg-danger/10",
  cancelled: "text-danger border-danger/30 bg-danger/10",
  rejected: "text-danger border-danger/30 bg-danger/10",
};

export function StatusBadge({ status }: { status: OrderStatus | PaymentStatus | string }) {
  const color = STATUS_COLOR[status] ?? "text-text-muted border-border bg-surface-sunken";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs",
        color,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Capability tag — brand-tinted chip for agent capabilities/listings. */
export function CapabilityTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-accent-subtle px-2 py-0.5 font-mono text-xs text-accent-soft">
      {children}
    </span>
  );
}
