import type { ReactNode } from "react";

export function SectionHead({
  eyebrow,
  title,
  children,
  center = false,
  goldTitle = false,
  id,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  center?: boolean;
  /** Show the eyebrow as a gold title: Cinzel, bold, larger. */
  goldTitle?: boolean;
  id?: string;
}) {
  return (
    <div className={`section-head reveal${center ? " center" : ""}`}>
      <span className={goldTitle ? "eyebrow gold-title" : "eyebrow"}>{eyebrow}</span>
      <h2 className="h2" id={id}>
        {title}
      </h2>
      <div className="rule" />
      {children ? <div className="lede" style={{ marginTop: 24 }}>{children}</div> : null}
    </div>
  );
}
