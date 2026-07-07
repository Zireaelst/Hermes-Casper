"use client";

import { useEffect, useRef } from "react";

// Hero background asset. Defaults to the original composition video; override with
// a Hermes-owned, licensed asset via NEXT_PUBLIC_HERO_VIDEO_URL when available.
const DEFAULT_VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4";
const VIDEO_URL = process.env.NEXT_PUBLIC_HERO_VIDEO_URL ?? DEFAULT_VIDEO_URL;

/**
 * Original hero visual: an ambient video anchored bottom-right on desktop,
 * stacked below the copy on mobile.
 *
 * Performance-optimized vs. the first version: it plays as a smooth,
 * GPU-composited autoplay loop instead of scrubbing `currentTime` on every
 * mousemove (which forced constant seeks). It only decodes while actually on
 * screen — paused when scrolled out of view or when the tab is hidden — lazily
 * fetches (`preload="metadata"`), and holds a single frame under
 * `prefers-reduced-motion`.
 */
export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.removeAttribute("autoplay");
      video.pause();
      return;
    }

    let onScreen = true;
    const play = () => {
      if (onScreen && !document.hidden) void video.play().catch(() => {});
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? false;
        if (onScreen) play();
        else video.pause();
      },
      { threshold: 0.01 },
    );
    io.observe(video);

    const onVisibility = () => (document.hidden ? video.pause() : play());
    document.addEventListener("visibilitychange", onVisibility);
    play();

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="pointer-events-none relative order-last aspect-square w-full overflow-hidden bg-surface-raised md:aspect-video lg:absolute lg:inset-0 lg:z-0 lg:order-none lg:aspect-auto lg:h-full lg:bg-transparent">
      <video
        ref={videoRef}
        muted
        loop
        autoPlay
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-hidden
        className="h-full w-full object-cover object-right lg:object-right-bottom"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
      {/* Left-to-right scrim so the headline stays legible over the video on desktop. */}
      <div
        className="absolute inset-0 hidden bg-gradient-to-r from-surface via-surface/70 to-transparent lg:block"
        aria-hidden
      />
    </div>
  );
}
