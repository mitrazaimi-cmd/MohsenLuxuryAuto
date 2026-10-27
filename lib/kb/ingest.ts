import "server-only";
import { parse } from "node-html-parser";
import { extractText, getDocumentProxy } from "unpdf";
import { store, type KbKind, type KbSource } from "@/lib/db";
import { deployVersion, integrations, siteUrl } from "@/lib/env";
import { chunkSections, hashText, normalize, sectionsFromText, type Section } from "./chunk";
import { embed } from "./voyage";

// Turns sources (the website, PDFs, typed text, Q&A) into searchable chunks.
// Chunks whose text didn't change keep their embedding, so re-syncs are cheap.

const embedText = (heading: string, content: string) => (heading ? `${heading}\n${content}` : content);

async function indexSource(source: KbSource, sections: Section[]) {
  try {
    const chunks = chunkSections(sections).map((c) => ({ ...c, contentHash: hashText(embedText(c.heading, c.content)) }));
    const known = new Map(
      (await store.listKbChunks(source.id)).filter((c) => c.embedding).map((c) => [c.contentHash, c.embedding]),
    );
    const missing = chunks.filter((c) => !known.has(c.contentHash));
    // Without embeddings the chunks still work for keyword search, so a Voyage failure isn't fatal.
    let warning = "";
    const vectors = await embed(missing.map((c) => embedText(c.heading, c.content)), "document").catch((err) => {
      console.error(`[kb] embedding "${source.title}" failed:`, err);
      warning = "Indexed for keyword search only: Voyage AI didn't respond. Press Re-index to try again.";
      return missing.map(() => null);
    });
    missing.forEach((c, i) => known.set(c.contentHash, vectors[i]));
    await store.replaceKbChunks(
      source.id,
      chunks.map((c) => ({ ...c, embedding: known.get(c.contentHash) ?? null })),
    );
    return await store.saveKbSource({ id: source.id, status: "ready", error: warning });
  } catch (err) {
    console.error(`[kb] indexing "${source.title}" failed:`, err);
    return await store.saveKbSource({ id: source.id, status: "error", error: String(err).slice(0, 500) });
  }
}

function textSections(source: Pick<KbSource, "kind" | "title" | "body">): Section[] {
  if (source.kind === "qa") return [{ heading: source.title, text: `Question: ${source.title}\nAnswer: ${source.body}` }];
  return sectionsFromText(source.title, source.body);
}

/** Adds (or, with an id, updates) a typed text or Q&A source and indexes it. */
export async function saveTextSource(input: { id?: string; kind: Extract<KbKind, "text" | "qa">; title: string; body: string }) {
  const source = await store.saveKbSource({ ...input, status: "processing", error: "" });
  return indexSource(source, textSections(source));
}

/** Reads the text out of a PDF and indexes it, one section per page. */
export async function addPdfSource(file: File) {
  const title = file.name.replace(/\.pdf$/i, "");
  const source = await store.saveKbSource({ kind: "pdf", title, status: "processing" });
  try {
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const { text } = await extractText(pdf, { mergePages: false });
    const sections = text.map((page, i) => ({ heading: `${title}, page ${i + 1}`, text: page }));
    if (!sections.some((s) => normalize(s.text).length > 20)) {
      return store.saveKbSource({
        id: source.id,
        status: "error",
        error: "No text found. This PDF may be a scanned image; please upload a text-based PDF.",
      });
    }
    return indexSource(source, sections);
  } catch (err) {
    return store.saveKbSource({ id: source.id, status: "error", error: `Could not read this PDF: ${String(err).slice(0, 300)}` });
  }
}

/** Re-runs indexing: text sources from their body, the website by crawling, PDFs by re-embedding their chunks. */
export async function reindexSource(id: string) {
  const source = await store.getKbSource(id);
  if (!source) return null;
  if (source.kind === "site") return syncSite();
  if (source.kind === "pdf") {
    const chunks = await store.listKbChunks(id);
    return indexSource(source, chunks.map((c) => ({ heading: c.heading, text: c.content })));
  }
  return indexSource(source, textSections(source));
}

// ---------- website ----------

const SITE_TITLE = "Website";
const SKIP_PATHS = new Set(["/privacy"]);

async function sitePages(): Promise<string[]> {
  const base = siteUrl();
  try {
    const xml = await (await fetch(`${base}/sitemap.xml`, { cache: "no-store" })).text();
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
    if (paths.length) return paths.filter((p) => !SKIP_PATHS.has(p));
  } catch (err) {
    console.error("[kb] sitemap fetch failed:", err);
  }
  return ["/", "/services", "/portfolio", "/about", "/contact"];
}

/** The page's <main> text, split into sections at its headings. */
async function pageSections(path: string): Promise<Section[]> {
  const res = await fetch(`${siteUrl()}${path}`, { cache: "no-store", headers: { "x-kb-sync": "1" } });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  const root = parse(await res.text());
  const pageTitle = root.querySelector("title")?.text.split("|")[0].trim() || path;
  const main = root.querySelector("main");
  if (!main) return [];
  main.querySelectorAll("script, style, noscript, svg, form, iframe, [aria-hidden=true]").forEach((el) => el.remove());
  for (const h of main.querySelectorAll("h1, h2, h3")) h.set_content(`§§${h.text.replace(/\s+/g, " ").trim()}`);

  const sections: Section[] = [];
  let heading = pageTitle;
  let buf: string[] = [];
  for (const line of main.structuredText.split("\n")) {
    if (line.startsWith("§§")) {
      if (buf.join("").trim()) sections.push({ heading, text: buf.join("\n") });
      heading = `${pageTitle}: ${line.slice(2)}`;
      buf = [];
    } else if (!/^\s*(\d{1,2}|[IVX]{1,4})\s*$/.test(line)) buf.push(line); // drop step numbers ("04", "II")
  }
  if (buf.join("").trim()) sections.push({ heading, text: buf.join("\n") });
  return sections;
}

async function siteSource() {
  const existing = (await store.listKbSources()).find((s) => s.kind === "site");
  return existing ?? store.saveKbSource({ kind: "site", title: SITE_TITLE, url: siteUrl(), status: "processing" });
}

/** Crawls the public pages and re-indexes them. Records the deploy it synced. */
export async function syncSite() {
  const source = await store.saveKbSource({ id: (await siteSource()).id, status: "processing", error: "" });
  const sections: Section[] = [];
  const failed: string[] = [];
  for (const path of await sitePages()) {
    try {
      sections.push(...(await pageSections(path)));
    } catch (err) {
      console.error(`[kb] page ${path} failed:`, err);
      failed.push(path);
    }
  }
  if (!sections.length) {
    return store.saveKbSource({ id: source.id, status: "error", error: `Could not read the website (${siteUrl()}).` });
  }
  const done = await indexSource(source, sections);
  return store.saveKbSource({
    id: done.id,
    version: kbVersion(),
    url: siteUrl(),
    error: failed.length ? `Skipped pages that failed to load: ${failed.join(", ")}` : done.error,
  });
}

/**
 * What the website index was built from: the deploy, plus whether embeddings were
 * on. Adding the Voyage key changes it, so the knowledge base re-indexes by itself.
 */
export function kbVersion() {
  return `${deployVersion()}${integrations.voyage ? "+embeddings" : ""}`;
}

/**
 * Re-syncs the website after each deploy: called (inside after()) by the chat API
 * and the admin knowledge page; does nothing when the synced version is current.
 */
export async function ensureSiteSynced() {
  const sources = await store.listKbSources();
  const source = sources.find((s) => s.kind === "site");
  if (source?.version === kbVersion()) return;
  // Another request is already syncing (a sync that hangs for 10 minutes is retried).
  if (source?.status === "processing" && Date.now() - Date.parse(source.updatedAt) < 10 * 60_000) return;
  const embeddingsJustAdded = integrations.voyage && !source?.version.endsWith("+embeddings");
  await syncSite();
  // Voyage was just connected: give PDFs, texts and Q&As their embeddings too.
  if (embeddingsJustAdded) {
    for (const s of sources.filter((x) => x.kind !== "site")) await reindexSource(s.id);
  }
}
