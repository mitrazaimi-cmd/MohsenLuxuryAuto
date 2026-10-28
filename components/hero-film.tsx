"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@/components/icons";

const SRC = "/images/specialties/Benz-video-landing-page.mp4";
const POSTER = "/images/hero-film-poster.webp";

// The owner's brand film beside the slogan: muted, looping. Like the hero logo it plays
// for everyone (the owner's call); the button pauses it, since it runs longer than 5s.
// If autoplay is blocked (e.g. iOS Low Power Mode) the poster stays and the button offers play.
export function HeroFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  // Autoplay can start before hydration, when React isn't listening for "play" yet.
  useEffect(() => {
    if (ref.current && !ref.current.paused) setPlaying(true);
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  return (
    <div className="frame portrait corners hero-film">
      <video
        ref={ref}
        src={SRC}
        poster={POSTER}
        width={720}
        height={1068}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        role="img"
        aria-label="A black Mercedes-Benz in cinematic light, ending on the Mohsen Luxury Auto logo"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button type="button" className="film-toggle" onClick={toggle} aria-label={playing ? "Pause the film" : "Play the film"}>
        {playing ? <Pause /> : <Play />}
      </button>
    </div>
  );
}
