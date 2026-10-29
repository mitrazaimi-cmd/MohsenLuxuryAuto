"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// The animated logo fades in from black, shimmers, and fades back to black at 5.3s.
// Play it once and hold on the full logo just before that fade-out.
// It deliberately ignores prefers-reduced-motion (the owner's call): it plays once,
// gently, and Windows reports "reduce" whenever its animation effects are off.
const HOLD_AT = 5;

const alt = "Mohsen Luxury Auto";

function StillLogo() {
  return (
    <Image className="hero-logo" src="/brand/logo.png" alt={alt} width={1774} height={887} priority sizes="(max-width: 760px) 92vw, 680px" />
  );
}

export function HeroLogo() {
  const ref = useRef<HTMLVideoElement>(null);
  // Blocked autoplay (e.g. iOS Low Power Mode) or a load error show the static logo.
  const [still, setStill] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let frame = 0;
    const hold = () => {
      if (video.currentTime >= HOLD_AT) video.pause();
      else frame = requestAnimationFrame(hold);
    };
    video.play().then(() => (frame = requestAnimationFrame(hold)), () => setStill(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (still) return <StillLogo />;
  return (
    <>
      <video
        ref={ref}
        className="hero-logo hero-logo-video"
        width={1774}
        height={888}
        muted
        playsInline
        preload="auto"
        role="img"
        aria-label={alt}
      >
        {/* 720px wide (0.2 MB instead of 1.2) for phones, where the logo is at most ~360px wide.
            A load error fires on the last <source> the browser tried, not on the <video>. */}
        <source src="/brand/logo-animated-mobile.mp4" type="video/mp4" media="(max-width: 760px)" />
        <source src="/brand/logo-animated.mp4" type="video/mp4" onError={() => setStill(true)} />
      </video>
      <noscript>
        {/* Plain <img>: next/image with priority would preload the PNG for every visitor. */}
        <img className="hero-logo" src="/brand/logo.png" alt={alt} width={1774} height={887} />
      </noscript>
    </>
  );
}
