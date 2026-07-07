"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { buttonVariants, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface SubmitButtonProps extends Omit<ButtonProps, "type"> {
  pendingLabel?: string;
}

/** Form submit button that reflects the enclosing <form action> pending state. */
export function SubmitButton({
  className,
  variant,
  size,
  children,
  pendingLabel,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {pending ? (pendingLabel ?? children) : children}
    </button>
  );
}
