import Image from "next/image";
import type { Testimonial } from "@/lib/db/types";

const bare = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Paragraphs from text pasted out of a PDF or email, where every line is hard-wrapped:
 * blank lines separate paragraphs, and so does a short line that ends a sentence
 * (the last line of a paragraph). Other line breaks are joined.
 */
function paragraphs(text: string, signature: string) {
  const all = text.replace(/\r/g, "").trimEnd().split("\n");
  // A closing line that repeats the client's name is already shown in the caption.
  if (all.length > 1 && signature && bare(all.at(-1)!) === bare(signature)) all.pop();
  const out: string[] = [];
  for (const block of all.join("\n").trimEnd().split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const width = Math.max(...lines.map((l) => l.length));
    let current: string[] = [];
    lines.forEach((line, i) => {
      current.push(line);
      const endsParagraph = lines.length > 2 && i < lines.length - 1 && line.length < width * 0.75 && /[.!?,:;]$/.test(line);
      if (endsParagraph) {
        out.push(current.join(" "));
        current = [];
      }
    });
    if (current.length) out.push(current.join(" "));
  }
  return out;
}

function Words({ item }: { item: Testimonial }) {
  const paras = paragraphs(item.quote, item.clientName);
  return (
    <figure className="testimonial-words">
      <span className="quote-mark" aria-hidden="true">
        &ldquo;
      </span>
      <blockquote className="letter-text">
        {paras.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </blockquote>
      <figcaption className="quote-by">
        {item.clientName}
        {item.model ? ` · ${item.model}` : ""}
      </figcaption>
    </figure>
  );
}

/**
 * Client testimonials, one after another: beside their photo when they have one (alternating
 * sides), otherwise centered like a letter. Set in the elegant italic (Cormorant).
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (!items.length) return null;
  let photos = 0;
  return (
    <div className="testimonials">
      {items.map((t) =>
        t.imageUrl ? (
          <div key={t.id} className={`testimonial-photo reveal${photos++ % 2 ? " flip" : ""}`}>
            <div className="frame corners">
              <Image
                src={t.imageUrl}
                alt={`${t.clientName || "A client"} on delivery day`}
                fill
                sizes="(max-width: 960px) 100vw, 480px"
                unoptimized={t.imageUrl.startsWith("http")}
                style={{ objectFit: "cover" }}
              />
            </div>
            <Words item={t} />
          </div>
        ) : (
          <div key={t.id} className="testimonial-letter reveal">
            <Words item={t} />
          </div>
        ),
      )}
    </div>
  );
}
