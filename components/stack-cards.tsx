"use client";

import { useEffect, useRef, type ComponentProps } from "react";

/**
 * Stacked cards (the owner's name for them, «کارت‌های روی هم»): while the page scrolls, each item
 * stops under the header a little lower than the one before, and the next slides over it. The
 * covered card settles back, slightly smaller and darker, so the steps pile up like a deck.
 * Items are `li.stack-card` (the sticky shell, measured here) around one `.stack-face` (the box,
 * moved here); the layout is in globals.css. The motion follows the visitor's own scrolling and
 * is subtle, so it runs under reduced motion too, as the owner chose for the scroll reveal.
 */
export function StackCards({ className, ...props }: ComponentProps<"ol">) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    const cards = Array.from(list.children) as HTMLElement[];
    const faces = cards.map((card) => card.firstElementChild as HTMLElement | null);
    let tops: number[] = [];
    let frame = 0;

    const measure = () => {
      tops = cards.map((card) => parseFloat(getComputedStyle(card).top) || 0);
    };
    const update = () => {
      frame = 0;
      const rects = cards.map((card) => card.getBoundingClientRect());
      // How deep each card lies in the pile, counted from the last one: a card sinks by how far
      // the next has slid over it (0 when it touches the bottom edge, 1 once it has stopped a
      // step lower), plus however deep that next card lies. Deeper cards are smaller and darker.
      let depth = 0;
      for (let i = cards.length - 2; i >= 0; i--) {
        const span = Math.max(rects[i].height - (tops[i + 1] - tops[i]), 1);
        const p = Math.min(Math.max((rects[i].bottom - rects[i + 1].top) / span, 0), 1);
        depth = p ? p + depth : 0;
        const face = faces[i];
        if (!face) continue;
        face.style.transform = depth ? `translateY(${(-6 * depth).toFixed(2)}px) scale(${(1 - 0.035 * depth).toFixed(4)})` : "";
        face.style.filter = depth ? `brightness(${Math.max(1 - 0.2 * depth, 0.4).toFixed(3)})` : "";
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    const stop = () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
    };

    // Listen only while the list is on screen.
    const io = new IntersectionObserver(([entry]) => {
      stop();
      if (!entry.isIntersecting) return;
      addEventListener("scroll", onScroll, { passive: true });
      addEventListener("resize", onResize);
      onResize();
    });
    io.observe(list);
    return () => {
      io.disconnect();
      stop();
      cancelAnimationFrame(frame);
    };
  }, []);

  return <ol ref={ref} className={className ? `stack ${className}` : "stack"} {...props} />;
}
