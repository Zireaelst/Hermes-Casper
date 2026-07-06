"use client";

import { useEffect, useRef } from "react";

// TEMPORARY third-party placeholder asset (hero spec §3).
// TODO(before-demo): replace with a Hermes-owned, licensed background video.
const PLACEHOLDER_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4";

const DESKTOP_MIN_WIDTH = 1024;

/**
 * Background video with native scrubbing (hero spec §3).
 * Desktop (≥1024px): horizontal mouse movement scrubs `currentTime`.
 * Mobile (<1024px): normal autoplay loop.
 * Reduced-motion: hold a single frame, no scrub, no autoplay.
 */
export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      video.pause();
      return;
    }

    // Mobile: plain autoplay loop.
    if (window.innerWidth < DESKTOP_MIN_WIDTH) {
      video.autoplay = true;
      video.loop = true;
      void video.play().catch(() => {});
      return;
    }

    // Desktop: scrub the timeline against horizontal mouse delta.
    let prevX: number | null = null;
    let targetTime = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < DESKTOP_MIN_WIDTH) return;
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration === 0) return;

      if (prevX === null) {
        prevX = e.clientX;
        return;
      }
      const delta = e.clientX - prevX;
      prevX = e.clientX;

      targetTime += (delta / window.innerWidth) * 0.8 * duration;
      targetTime = Math.max(0, Math.min(duration, targetTime));
      video.currentTime = targetTime;
    };

    const onSeeked = () => {
      // Keeps the scrub frame-accurate between mouse events.
    };

    window.addEventListener("mousemove", onMouseMove);
    video.addEventListener("seeked", onSeeked);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      video.removeEventListener("seeked", onSeeked);
    };
  }, []);

  return (
    <div className="pointer-events-none relative order-last aspect-square w-full overflow-hidden bg-surface-raised md:aspect-video lg:absolute lg:inset-0 lg:z-0 lg:order-none lg:aspect-auto lg:h-full lg:bg-transparent">
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        aria-hidden
        className="h-full w-full object-cover object-right lg:object-right-bottom"
      >
        <source src={PLACEHOLDER_VIDEO_URL} type="video/mp4" />
      </video>
    </div>
  );
}
