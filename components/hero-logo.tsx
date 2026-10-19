"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// The animated logo fades in from black, shimmers, and fades back to black at 5.3s.
// Play it once and hold on the full logo just before that fade-out.
const HOLD_AT = 5;

const alt = "Mohsen Luxury Auto";

function StillLogo() {
  return (
    <Image className="hero-logo" src="/brand/logo.png" alt={alt} width={1774} height={887} priority sizes="(max-width: 760px) 92vw, 680px" />
  );
}

export function HeroLogo() {
  const ref = useRef<HTMLVideoElement>(null);
  // Reduced motion, blocked autoplay (e.g. iOS Low Power Mode) or a load error show the static logo.
  const [still, setStill] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStill(true);
      return;
    }
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
        src="/brand/logo-animated.mp4"
        width={1774}
        height={888}
        muted
        playsInline
        preload="auto"
        role="img"
        aria-label={alt}
        onError={() => setStill(true)}
      />
      <noscript>
        {/* Plain <img>: next/image with priority would preload the PNG for every visitor. */}
        <img className="hero-logo" src="/brand/logo.png" alt={alt} width={1774} height={887} />
      </noscript>
    </>
  );
}
