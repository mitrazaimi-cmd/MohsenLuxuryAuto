import type { ReactNode } from "react";
import { Swoosh } from "./swoosh";

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <section className="page-hero">
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="h1">{title}</h1>
        <div className="rule" />
        {children ? <div className="lede">{children}</div> : null}
      </div>
      <Swoosh />
    </section>
  );
}
