"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Stagger delay in seconds. */
  delay?: number;
  className?: string;
  /** Element tag to render (defaults to div). */
  as?: "div" | "section" | "li" | "span";
}

/**
 * Reveals children with a subtle fade-and-rise the first time they scroll into
 * view. Motion is skipped entirely under `prefers-reduced-motion`.
 */
export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as];

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </MotionTag>
  );
}
