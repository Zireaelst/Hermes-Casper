import Link from "next/link";
import type { ReactNode } from "react";

/** Sidebar/top-nav link with muted-to-emphasized hover treatment. */
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
