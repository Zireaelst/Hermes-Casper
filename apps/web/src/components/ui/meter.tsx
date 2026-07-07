import { cn } from "@/lib/utils";

interface MeterProps {
  /** 0–1 fill ratio (clamped). */
  value: number;
  className?: string;
  /** Tone of the fill; defaults to accent, shifts to warning/danger near full. */
  tone?: "accent" | "success" | "warning" | "danger";
  label?: string;
}

const TONE_FILL: Record<NonNullable<MeterProps["tone"]>, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** Thin progress meter for budget / quota usage. Accessible via role=meter. */
export function Meter({ value, className, tone = "accent", label }: MeterProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken", className)}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", TONE_FILL[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
