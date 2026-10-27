import "server-only";
import { integrations } from "@/lib/env";

// Voyage AI: embeddings for meaning-based search, and a reranker that orders the
// candidates by how well they answer the question. REST only (no official TS SDK).

const API = "https://api.voyageai.com/v1";
export const EMBED_MODEL = "voyage-3.5";
export const EMBED_DIMENSIONS = 1024; // matches kb_chunks.embedding in 0002_chatbot.sql
const RERANK_MODEL = "rerank-2.5";
const BATCH = 64;

async function call<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Voyage ${path} failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

/** Embeds texts, or returns nulls when Voyage isn't configured (keyword search still works). */
export async function embed(texts: string[], inputType: "document" | "query"): Promise<(number[] | null)[]> {
  if (!integrations.voyage || !texts.length) return texts.map(() => null);
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH) {
    const res = await call<{ data: { embedding: number[]; index: number }[] }>("/embeddings", {
      input: texts.slice(i, i + BATCH),
      model: EMBED_MODEL,
      input_type: inputType,
      output_dimension: EMBED_DIMENSIONS,
    });
    for (const d of res.data.toSorted((a, b) => a.index - b.index)) out.push(d.embedding);
  }
  return out;
}

/** Relevance scores (0..1) for each document, in the documents' order; null without Voyage. */
export async function rerank(query: string, documents: string[]): Promise<number[] | null> {
  if (!integrations.voyage || !documents.length) return null;
  const res = await call<{ data: { index: number; relevance_score: number }[] }>("/rerank", {
    query,
    documents,
    model: RERANK_MODEL,
  });
  const scores = documents.map(() => 0);
  for (const d of res.data) scores[d.index] = d.relevance_score;
  return scores;
}
