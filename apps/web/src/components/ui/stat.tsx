import type { ReactNode } from "react";
import { Card } from "./card";

/** Labelled metric tile used across the console dashboards. */
export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </Card>
  );
}
