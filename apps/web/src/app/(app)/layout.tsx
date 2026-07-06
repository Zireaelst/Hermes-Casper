import Link from "next/link";
import { NavLink } from "@/components/ui";

// Dark console shell — unchanged from the previous root layout. The light-first
// design system (design-system.md) applies to the marketing surface only this
// session; migrating this console is a tracked follow-up (see NEXT_SESSION.md).
export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col gap-1 border-r border-border p-4">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-3">
          <span className="grid size-7 place-items-center rounded-lg bg-accent font-bold text-accent-fg">
            H
          </span>
          <span className="font-semibold tracking-tight">Hermes</span>
        </Link>
        <NavLink href="/dashboard">Dashboard</NavLink>
        <NavLink href="/marketplace">Marketplace</NavLink>
        <NavLink href="/orders">Orders</NavLink>
        <NavLink href="/approvals">Approvals</NavLink>
        <div className="mt-auto rounded-lg border border-border bg-surface-raised p-3 text-xs text-text-muted">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-warning" aria-hidden />
            demo mode
          </div>
          casper:casper-test · simulated settlement
        </div>
      </aside>
      <main className="mx-auto w-full max-w-5xl flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
