import type { ReactNode } from "react";

/** Inline monospaced treatment for hashes, keys, and other machine identifiers. */
export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs text-text-muted break-all">{children}</span>;
}
