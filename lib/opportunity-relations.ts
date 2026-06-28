/* Pure helpers for the opportunity detail page.
 * All deterministic, no DB calls — fed whatever rows the page already loaded.
 */

export interface RelatedCandidate {
  id: string;
  title: string;
  industry: string;
  opportunityScore: number;
  keywords: string[];
  createdAt: Date;
}

/* Case-insensitive count of keywords shared between two lists. */
export function keywordOverlapCount(
  a: string[],
  b: string[]
): number {
  const A = new Set(a.map((k) => k.toLowerCase().trim()));
  const B = new Set(b.map((k) => k.toLowerCase().trim()));
  let count = 0;
  for (const k of A) if (B.has(k)) count++;
  return count;
}

/* Select up to `limit` related opportunities for a given opportunity:
 *   1. exclude self
 *   2. keyword overlap >= 2 (case-insensitive)
 *      sort: overlap desc, score desc, createdAt desc
 *   3. fill from same industry if fewer than limit
 *      sort: score desc, createdAt desc
 *   4. dedupe
 * Returns at most `limit` rows.
 */
export function selectRelated(
  current: RelatedCandidate,
  pool: RelatedCandidate[],
  limit = 3
): { op: RelatedCandidate; shared: number }[] {
  const others = pool.filter((o) => o.id !== current.id);

  const byOverlap = others
    .map((o) => ({ op: o, shared: keywordOverlapCount(current.keywords, o.keywords) }))
    .filter((x) => x.shared >= 2)
    .sort((a, b) =>
      b.shared !== a.shared
        ? b.shared - a.shared
        : b.op.opportunityScore - a.op.opportunityScore ||
        b.op.createdAt.getTime() - a.op.createdAt.getTime()
    );

  const chosen: { op: RelatedCandidate; shared: number }[] = [];
  const seen = new Set<string>();

  for (const item of byOverlap) {
    if (chosen.length >= limit) break;
    if (seen.has(item.op.id)) continue;
    chosen.push(item);
    seen.add(item.op.id);
  }

  // fallback to same industry
  if (chosen.length < limit) {
    const sameIndustry = others
      .filter((o) => o.industry === current.industry && !seen.has(o.id))
      .sort(
        (a, b) =>
          b.opportunityScore - a.opportunityScore ||
          b.createdAt.getTime() - a.createdAt.getTime()
      );
    for (const op of sameIndustry) {
      if (chosen.length >= limit) break;
      chosen.push({ op, shared: 0 });
      seen.add(op.id);
    }
  }

  return chosen.slice(0, limit);
}

export interface NeighbourCandidate {
  id: string;
  createdAt: Date;
}

/* Given the current id and ALL opportunities ordered by createdAt DESC,
 * return the ids of the previous and next opportunity in that order.
 * "Next" = the one created immediately AFTER current (smaller createdAt arr idx).
 * "Prev" = the one created immediately BEFORE current (larger createdAt arr idx).
 */
export function selectPrevNext(
  currentId: string,
  orderedDesc: NeighbourCandidate[]
): { prev: string | null; next: string | null } {
  const idx = orderedDesc.findIndex((o) => o.id === currentId);
  if (idx === -1) return { prev: null, next: null };
  // orderedDesc[0] is newest. Prev (older) = idx+1, Next (newer) = idx-1.
  const prev = idx + 1 < orderedDesc.length ? orderedDesc[idx + 1].id : null;
  const next = idx - 1 >= 0 ? orderedDesc[idx - 1].id : null;
  return { prev, next };
}