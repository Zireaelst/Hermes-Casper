import { formatAmount } from "@hermes/shared";
import { cn } from "@/lib/utils";

/** Renders a token amount with monospaced, tabular figures and the HERMES unit. */
export function AmountText({ amount, className }: { amount: string; className?: string }) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {formatAmount(amount, 9)} <span className="text-text-muted">HERMES</span>
    </span>
  );
}
