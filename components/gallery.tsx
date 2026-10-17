"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import type { PortfolioItem } from "@/lib/db/types";
import { ArrowLeft, ArrowRight, Close } from "./icons";

// Delivery gallery with a model filter and an accessible <dialog> lightbox
// (focus is trapped and Escape closes it natively).
export function Gallery({ items }: { items: PortfolioItem[] }) {
  const models = useMemo(() => Array.from(new Set(items.map((i) => i.model).filter(Boolean))), [items]);
  const [filter, setFilter] = useState<string>("All");
  const [index, setIndex] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const visible = filter === "All" ? items : items.filter((i) => i.model === filter);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = (d: number) => setIndex((i) => (i + d + visible.length) % visible.length);
  const current = visible[index];

  return (
    <>
      {models.length > 1 ? (
        <div className="filter-bar" role="group" aria-label="Filter by model">
          {["All", ...models].map((m) => (
            <button key={m} type="button" aria-pressed={filter === m} onClick={() => setFilter(m)}>
              {m}
            </button>
          ))}
        </div>
      ) : null}
      <div className="gallery">
        {visible.map((item, i) => (
          <button key={item.id} type="button" onClick={() => open(i)} aria-label={`Open photo: ${caption(item)}`}>
            <figure>
              <div className="frame">
                <Image src={item.imageUrl} alt={caption(item)} fill sizes="(max-width: 560px) 100vw, (max-width: 960px) 50vw, 33vw" unoptimized />
              </div>
              <figcaption>
                {item.model ? <b>{item.model}</b> : null}
                {item.caption || (item.clientFirstName ? `Delivery day for ${item.clientFirstName}` : "")}
              </figcaption>
            </figure>
          </button>
        ))}
      </div>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-label="Delivery photo"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
      >
        {current ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.imageUrl} alt={caption(current)} />
            <div className="lb-bar">
              <p>{caption(current)}</p>
              <div className="actions" style={{ gap: 8, flexWrap: "nowrap" }}>
                {visible.length > 1 ? (
                  <>
                    <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Previous photo">
                      <ArrowLeft />
                    </button>
                    <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Next photo">
                      <ArrowRight />
                    </button>
                  </>
                ) : null}
                <button type="button" className="icon-btn" onClick={() => dialog.current?.close()} aria-label="Close" autoFocus>
                  <Close />
                </button>
              </div>
            </div>
          </>
        ) : null}
      </dialog>
    </>
  );
}

function caption(i: PortfolioItem) {
  return i.caption || [i.clientFirstName && `${i.clientFirstName}'s`, i.model, "delivery"].filter(Boolean).join(" ");
}
