"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume, VolumeOff } from "@/components/icons";

const SRC = "/images/specialties/Benz-video-landing-page.mp4";
const POSTER = "/images/hero-film-poster.webp";
// The generator's "Veo" mark shows until 7.8s; the film stays zoomed past it until then.
const MARK_UNTIL = 8.2;

// The owner's brand film beside the slogan: looping, muted until the visitor turns the sound
// on (browsers only autoplay muted video). Like the hero logo it plays for everyone (the
// owner's call); the button pauses it, since it runs longer than 5s.
// If autoplay is blocked (e.g. iOS Low Power Mode) the poster stays and the button offers play.
export function HeroFilm() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [zoom, setZoom] = useState(true);
  // "seeking" also fires when the loop jumps back to the start.
  const track = (e: React.SyntheticEvent<HTMLVideoElement>) => setZoom(e.currentTarget.currentTime < MARK_UNTIL);

  // Autoplay can start before hydration, when React isn't listening for "play" yet.
  useEffect(() => {
    if (ref.current && !ref.current.paused) setPlaying(true);
  }, []);

  // With the sound on, pause while the film is scrolled out of view (its buttons go with it)
  // and carry on when it's back.
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    let pausedByScroll = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && !video.muted && !video.paused) {
        pausedByScroll = true;
        video.pause();
      } else if (entry.isIntersecting && pausedByScroll) {
        pausedByScroll = false;
        video.play().catch(() => {});
      }
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  };

  const toggleSound = () => {
    const video = ref.current;
    if (!video) return;
    video.muted = !video.muted;
    if (!video.muted && video.paused) video.play().catch(() => {});
  };

  return (
    <div className="frame portrait corners hero-film">
      <video
        ref={ref}
        className={zoom ? "zoom" : undefined}
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
        onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
        onTimeUpdate={track}
        onSeeking={track}
      />
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
