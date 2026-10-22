import type { ReactNode } from "react";

export function SectionHead({
  eyebrow,
  title,
  children,
  center = false,
  id,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  center?: boolean;
  id?: string;
}) {
  return (
    <div className={`section-head reveal${center ? " center" : ""}`}>
      <span className="eyebrow gold-title">{eyebrow}</span>
      <h2 className="h2" id={id}>
        {title}
      </h2>
      <div className="rule" />
      {children ? <div className="lede" style={{ marginTop: 24 }}>{children}</div> : null}
    </div>
  );
}
