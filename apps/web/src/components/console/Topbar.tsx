"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RuntimeMode } from "@/lib/mode";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const MOBILE_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/marketplace", label: "Market" },
  { href: "/orders", label: "Orders" },
  { href: "/approvals", label: "Approvals" },
  { href: "/network", label: "Network" },
];

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  marketplace: "Marketplace",
  orders: "Orders",
  approvals: "Approvals",
  network: "Network",
};

function useCrumbs(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return ["Dashboard"];
  const root = TITLES[segments[0]!] ?? segments[0]!;
  if (segments.length > 1) {
    const tail = segments[1]!;
    return [root, tail.length > 12 ? `${tail.slice(0, 8)}…` : tail];
  }
  return [root];
}

export function Topbar({ mode }: { mode: RuntimeMode }) {
  const pathname = usePathname();
  const crumbs = useCrumbs(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Link href="/" className="flex items-center gap-1.5 lg:hidden">
            <span className="grid size-6 place-items-center rounded-lg bg-accent text-xs font-bold text-accent-fg">
              H
            </span>
          </Link>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            {crumbs.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-text-subtle">/</span>}
                <span
                  className={cn(
                    "truncate",
                    i === crumbs.length - 1
                      ? "font-medium text-text-strong"
                      : "text-text-muted",
                    i > 0 && "font-mono text-xs",
                  )}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex",
              mode.onChain
                ? "border-success/30 bg-success/10 text-success"
                : "border-warning/30 bg-warning/10 text-warning",
            )}
            title={mode.settlement}
          >
            <span className="relative flex size-1.5">
              {mode.onChain && (
                <span className="animate-ping-soft absolute inline-flex size-full rounded-full bg-success/70" />
              )}
              <span
                className={cn(
                  "relative inline-flex size-1.5 rounded-full",
                  mode.onChain ? "bg-success" : "bg-warning",
                )}
              />
            </span>
            {mode.onChain ? "On-chain" : "Simulated"}
          </span>
          <span className="hidden rounded-full border border-border bg-surface-raised px-2.5 py-1 font-mono text-xs text-text-muted md:inline-flex">
            {mode.network}
          </span>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile nav (sidebar is hidden below lg). */}
      <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-1.5 lg:hidden">
        {MOBILE_LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-surface-sunken font-medium text-text-strong"
                  : "text-text-muted hover:bg-surface-hover",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
