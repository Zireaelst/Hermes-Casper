"use client";

import { Bot, LayoutDashboard, Network, ShieldCheck, ShoppingBag, SquareStack } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface SidebarProps {
  pendingApprovals: number;
  agentName: string;
  agentReputation: string;
  dataSource: string;
}

export function Sidebar({ pendingApprovals, agentName, agentReputation, dataSource }: SidebarProps) {
  const pathname = usePathname();

  const groups: { heading: string; items: NavItem[] }[] = [
    {
      heading: "Overview",
      items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      heading: "Autonomous",
      items: [{ href: "/agents", label: "Agents", icon: Bot }],
    },
    {
      heading: "Manual",
      items: [
        { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
        { href: "/orders", label: "Orders", icon: SquareStack },
        {
          href: "/approvals",
          label: "Approvals",
          icon: ShieldCheck,
          badge: pendingApprovals || undefined,
        },
      ],
    },
    {
      heading: "Infrastructure",
      items: [{ href: "/network", label: "Network", icon: Network }],
    },
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface-raised/60 p-4 lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-2 px-2 pt-2">
        <span className="grid size-8 place-items-center rounded-xl bg-accent text-sm font-bold text-accent-fg">
          H
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-text-strong">Hermes</span>
        <span className="text-sm leading-none text-accent-soft">&#10033;</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6">
        {groups.map((group) => (
          <div key={group.heading}>
            <p className="mb-1.5 px-3 text-[11px] font-medium tracking-wider text-text-subtle uppercase">
              {group.heading}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, badge }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-surface-sunken font-medium text-text-strong"
                          : "text-text-muted hover:bg-surface-hover hover:text-text",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-accent-soft" : "text-text-subtle group-hover:text-text",
                        )}
                        aria-hidden
                      />
                      <span className="flex-1">{label}</span>
                      {badge ? (
                        <span className="grid min-w-5 place-items-center rounded-full bg-warning/15 px-1.5 text-xs font-medium text-warning">
                          {badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-4 rounded-xl border border-border bg-surface p-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-accent-subtle text-xs font-semibold text-accent-soft">
            {agentName.charAt(0)}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-text-strong">{agentName}</div>
            <div className="text-xs text-text-subtle">{agentReputation} · buyer</div>
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 border-t border-border pt-2.5 text-xs text-text-subtle">
          <span className="size-1.5 rounded-full bg-info" aria-hidden />
          {dataSource}
        </div>
      </div>
    </aside>
  );
}
