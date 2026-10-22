import type { ReactNode } from "react";
import { Swoosh } from "./swoosh";

export function PageHero({
  eyebrow,
  title,
  children,
  center = false,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  center?: boolean;
}) {
  return (
    <section className={`page-hero${center ? " center" : ""}`}>
      <div className="container">
        <span className="eyebrow gold-title">{eyebrow}</span>
        <h1 className="h1">{title}</h1>
        <div className="rule" />
        {children ? <div className="lede">{children}</div> : null}
      </div>
      <Swoosh />
    </section>
  );
}
