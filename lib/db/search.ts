// Reciprocal rank fusion: merges ranked id lists (semantic and keyword search)
// into one ranking. k = 60 is the usual constant; it damps the top ranks.
export function fuseRanks(lists: string[][], limit: number, k = 60) {
  const scores = new Map<string, number>();
  for (const list of lists) {
    list.forEach((id, rank) => scores.set(id, (scores.get(id) ?? 0) + 1 / (k + rank + 1)));
  }
  return [...scores.entries()]
    .map(([id, score]) => ({ id, score }))
    .toSorted((a, b) => b.score - a.score)
    .slice(0, limit);
}
