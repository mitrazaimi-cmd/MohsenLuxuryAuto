"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume, VolumeOff } from "@/components/icons";

const SRC = "/images/specialties/Benz-video-landing-page.mp4";
// 540px wide, 1.7 MB instead of 4.7: phones show the film at most 300px wide.
const SRC_PHONE = "/images/specialties/Benz-video-landing-page-mobile.mp4";
const POSTER = "/images/hero-film-poster.webp";
// Clicks on these navigate or have their own job; they shouldn't also start the music.
const OWN_ACTION = "a, button, input, select, textarea, label, summary";

// The owner's brand film beside the slogan, looping, with its music on by default (the
// owner's call). Browsers refuse sound before the visitor has interacted with the page, so
// when they do, the film plays muted and the sound comes on with the first click or tap on
// the page while the film is in view. The speaker button mutes it for good (keyboard users
// turn the sound on there too); the other button
// pauses it, since it runs longer than 5s. Like the hero logo it plays for everyone.
// If even muted autoplay is blocked (e.g. iOS Low Power Mode) the poster stays and the
// button offers play.
export function HeroFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  // Stops listening for the first click or tap; the speaker button calls it too.
  const stopWaiting = useRef(() => {});
  const userPaused = useRef(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let inView = true;
    let pausedByScroll = false;
    let cancelled = false;

    // With the sound on, pause while the film is scrolled out of view (its buttons go with it)
    // and carry on when it's back.
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView && !video.muted && !video.paused) {
        pausedByScroll = true;
        video.pause();
      } else if (inView && pausedByScroll) {
        pausedByScroll = false;
        video.play().catch(() => {});
      }
    });
    observer.observe(video);

    const onGesture = (e: Event) => {
      if (!inView || (e.target instanceof Element && e.target.closest(OWN_ACTION))) return;
      const wasPlaying = !video.paused;
      video.muted = false;
      if (wasPlaying && video.paused) {
        // The browser didn't count it as an interaction (e.g. a touch that ended a scroll) and
        // paused the film instead: back to muted, and wait for the next one.
        video.muted = true;
        video.play().catch(() => {});
        return;
      }
      // Even muted autoplay was blocked (e.g. iOS Low Power Mode): start it now.
      if (video.paused && !userPaused.current) video.play().catch(() => {});
      stop();
    };
    const gestures = ["pointerup", "touchend"] as const;
    const stop = () => gestures.forEach((g) => document.removeEventListener(g, onGesture));
    stopWaiting.current = stop;

    video.muted = false;
    video
      .play()
      .catch(() => {
        if (cancelled) return;
        video.muted = true;
        gestures.forEach((g) => document.addEventListener(g, onGesture));
        return video.play();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      observer.disconnect();
      stop();
    };
  }, []);

  const togglePlay = () => {
    const video = ref.current;
    if (!video) return;
    userPaused.current = !video.paused;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const toggleSound = () => {
    const video = ref.current;
    if (!video) return;
    stopWaiting.current();
    video.muted = !video.muted;
    if (!video.muted && video.paused) video.play().catch(() => {});
  };

  return (
    <div className="frame portrait corners hero-film">
      <video
        ref={ref}
        poster={POSTER}
        width={720}
        height={1068}
        loop
        playsInline
        preload="auto"
        role="img"
        aria-label="A black Mercedes-Benz in cinematic light, ending on the Mohsen Luxury Auto logo"
        onPlay={(e) => {
          setPlaying(true);
          setMuted(e.currentTarget.muted);
        }}
        onPause={() => setPlaying(false)}
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
      >
        <source src={SRC_PHONE} type="video/mp4" media="(max-width: 760px)" />
        <source src={SRC} type="video/mp4" />
      </video>
      <div className="film-controls">
        <button type="button" className="film-btn" onClick={togglePlay} aria-label={playing ? "Pause the film" : "Play the film"}>
          {playing ? <Pause /> : <Play />}
        </button>
        <button type="button" className="film-btn" onClick={toggleSound} aria-label={muted ? "Turn the sound on" : "Turn the sound off"}>
          {muted ? <VolumeOff strokeWidth={2.25} /> : <Volume strokeWidth={2.25} />}
        </button>
      </div>
    </div>
  );
}
