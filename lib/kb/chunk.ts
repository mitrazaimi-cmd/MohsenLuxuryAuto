import "server-only";
import { createHash } from "node:crypto";

export interface Section {
  heading: string;
  text: string;
}

// About 700 tokens per chunk, with a short overlap so an answer that spans a
// paragraph break still lands whole in one chunk.
const MAX_CHARS = 2800;
const OVERLAP_CHARS = 300;

export function hashText(s: string) {
  return createHash("sha256").update(s).digest("hex").slice(0, 32);
}

export function normalize(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Splits sections into chunks, keeping each chunk under one heading. */
export function chunkSections(sections: Section[]) {
  const chunks: { heading: string; content: string }[] = [];
  for (const { heading, text } of sections) {
    const body = normalize(text);
    if (body.length < 20) continue;
    let current = "";
    for (const para of body.split(/\n\n+/)) {
      for (const piece of splitLong(para)) {
        if (current && current.length + piece.length + 2 > MAX_CHARS) {
          chunks.push({ heading, content: current });
          current = `${current.slice(-OVERLAP_CHARS).replace(/^\S*\s/, "")}\n\n${piece}`;
        } else {
          current = current ? `${current}\n\n${piece}` : piece;
        }
      }
    }
    if (current) chunks.push({ heading, content: current });
  }
  return chunks;
}

/** Breaks a paragraph longer than one chunk at sentence ends. */
function splitLong(para: string) {
  if (para.length <= MAX_CHARS) return [para];
  const out: string[] = [];
  let current = "";
  for (const sentence of para.split(/(?<=[.!?])\s+/)) {
    if (current && current.length + sentence.length + 1 > MAX_CHARS) {
      out.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) out.push(current);
  return out.flatMap((s) => (s.length > MAX_CHARS ? s.match(new RegExp(`.{1,${MAX_CHARS}}`, "gs")) ?? [] : [s]));
}

/** Plain text split into sections at Markdown-style headings ("# Title"), if any. */
export function sectionsFromText(title: string, text: string): Section[] {
  const sections: Section[] = [];
  let heading = title;
  let buf: string[] = [];
  for (const line of text.split("\n")) {
    const m = /^#{1,3}\s+(.+)$/.exec(line.trim());
    if (m) {
      if (buf.join("").trim()) sections.push({ heading, text: buf.join("\n") });
      heading = m[1].trim();
      buf = [];
    } else buf.push(line);
  }
  if (buf.join("").trim()) sections.push({ heading, text: buf.join("\n") });
  return sections;
}
