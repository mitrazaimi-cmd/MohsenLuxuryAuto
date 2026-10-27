import { Fragment, type ReactNode } from "react";

// The small Markdown subset the assistant uses: paragraphs, bullet and numbered
// lists, **bold**, [links](url) and bare URLs. Rendered as React nodes, never as HTML.

const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)|(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g;

function link(href: string, label: string, key: number) {
  const internal = href.startsWith("/") || (typeof window !== "undefined" && href.startsWith(window.location.origin));
  return internal ? (
    <a key={key} href={href}>{label}</a>
  ) : (
    <a key={key} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
  );
}

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[2]) out.push(link(m[3], m[2], k++));
    else if (m[4]) out.push(link(m[4], m[4].replace(/^https?:\/\//, ""), k++));
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
          const ordered = /^\s*\d/.test(lines[0]);
          const items = lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ""))}</li>);
          return ordered ? <ol key={i}>{items}</ol> : <ul key={i}>{items}</ul>;
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <Fragment key={j}>
                {j ? <br /> : null}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
