import "server-only";
import { store, type KbMatch } from "@/lib/db";
import { embed, rerank } from "./voyage";

// Hybrid retrieval: meaning-based (Voyage embeddings) plus keyword (full-text)
// candidates, merged by rank, then reordered by the Voyage reranker.

const STOPWORDS = new Set(
  "a an and are as at be but by can do does for from how i if in is it me my of on or so that the this to was what when where which who why will with you your".split(" "),
);
/** Below this rerank score the best match doesn't really answer the question. */
const RELEVANT = 0.35;

export function searchTerms(query: string) {
  const words = query.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return [...new Set(words.filter((w) => w.length > 1 && !STOPWORDS.has(w)))].slice(0, 12);
}

export interface KnowledgeResult {
  matches: (KbMatch & { relevance: number | null })[];
  /** True when nothing in the knowledge base answers the question well. */
  unanswered: boolean;
}

export async function searchKnowledge(query: string, limit = 5): Promise<KnowledgeResult> {
  const [embedding] = await embed([query], "query");
  const candidates = await store.searchKb({ embedding, terms: searchTerms(query), limit: limit * 3 });
  if (!candidates.length) return { matches: [], unanswered: true };

  const scores = await rerank(query, candidates.map((c) => `${c.heading}\n${c.content}`));
  if (!scores) {
    return { matches: candidates.slice(0, limit).map((c) => ({ ...c, relevance: null })), unanswered: false };
  }
  const ranked = candidates
    .map((c, i) => ({ ...c, relevance: scores[i] }))
    .toSorted((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
  return {
    matches: ranked.filter((m, i) => i < 2 || m.relevance >= RELEVANT),
    unanswered: ranked[0].relevance < RELEVANT,
  };
}
