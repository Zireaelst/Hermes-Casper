import { formatAmount } from "@hermes/shared";
import type { OrderStatus, PaymentStatus } from "@hermes/types";
import Link from "next/link";
import type { ReactNode } from "react";

/** Canonical status → color mapping (design-system.md §6). */
const STATUS_COLOR: Record<string, string> = {
  quoted: "text-info border-info/40 bg-info/10",
  verifying: "text-info border-info/40 bg-info/10",
  authorized: "text-warning border-warning/40 bg-warning/10",
  settling: "text-warning border-warning/40 bg-warning/10",
  settled: "text-success border-success/40 bg-success/10",
  done: "text-success border-success/40 bg-success/10",
  active: "text-success border-success/40 bg-success/10",
  failed: "text-danger border-danger/40 bg-danger/10",
  expired: "text-danger border-danger/40 bg-danger/10",
  cancelled: "text-danger border-danger/40 bg-danger/10",
};

export function StatusBadge({ status }: { status: OrderStatus | PaymentStatus | string }) {
  const color = STATUS_COLOR[status] ?? "text-text-muted border-border bg-surface-hover";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-xs ${color}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

export function AmountText({
  amount,
  className = "",
}: {
  amount: string;
  className?: string;
}) {
  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {formatAmount(amount, 9)} <span className="text-text-muted">HERMES</span>
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface-raised p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </Card>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs text-text-muted break-all">{children}</span>;
}

export function EmptyState({ title, hint, cta }: { title: string; hint: string; cta?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-2 py-14 text-center">
      <div className="text-lg font-medium">{title}</div>
      <p className="max-w-sm text-sm text-text-muted">{hint}</p>
      {cta}
    </Card>
  );
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {sub ? <p className="mt-1 text-sm text-text-muted">{sub}</p> : null}
    </header>
  );
}

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
    >
      {children}
    </Link>
  );
}
