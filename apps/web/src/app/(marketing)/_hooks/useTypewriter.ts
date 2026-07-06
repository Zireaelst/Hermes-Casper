"use client";

import { useEffect, useState } from "react";

export interface TypewriterResult {
  displayed: string;
  done: boolean;
}

/**
 * Types out `text` one character at a time (hero spec §6).
 * Returns the currently-displayed slice and whether typing has finished.
 * Respects reduced-motion by rendering the full string immediately.
 */
export function useTypewriter(text: string, speed = 38, startDelay = 600): TypewriterResult {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      // Async so we don't call setState synchronously in the effect body.
      const fill = setTimeout(() => {
        setDisplayed(text);
        setDone(true);
      }, 0);
      return () => clearTimeout(fill);
    }

    let index = 0;
    let interval: ReturnType<typeof setInterval> | undefined;

    const start = setTimeout(() => {
      interval = setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          if (interval) clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(start);
      if (interval) clearInterval(interval);
    };
  }, [text, speed, startDelay]);

  return { displayed, done };
}
