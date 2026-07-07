import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Adds hover elevation + border emphasis for clickable cards. */
  interactive?: boolean;
}

export function Card({ children, className, interactive }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface-raised p-5",
        interactive &&
          "shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong",
        className,
      )}
    >
      {children}
    </div>
  );
}
