import type { ReactNode } from "react";
import { Card } from "./card";

/** Centered placeholder for empty lists, with an optional call to action. */
export function EmptyState({ title, hint, cta }: { title: string; hint: string; cta?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-2 py-14 text-center">
      <div className="text-lg font-medium">{title}</div>
      <p className="max-w-sm text-sm text-text-muted">{hint}</p>
      {cta}
    </Card>
  );
}
