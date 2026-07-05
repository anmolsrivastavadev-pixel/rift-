/* M30 — curated niche suggestions for the complaint finder.
 *
 * Pure data + a pick helper. No AI, no DB. Exists so a beginner never faces
 * the blank "type a market" box: one click fills and runs the finder. Niches
 * are deliberately beginner-friendly — concrete, searchable markets people
 * recognise, spread across local services, consumer life, and work tools.
 */

export const NICHE_SUGGESTIONS = [
  // Local services
  "dog groomers",
  "wedding planners",
  "small gym owners",
  "house cleaning services",
  "car repair shops",
  "hair salons",
  "landlords and renting",
  "moving companies",
  // Consumer life
  "meal prep",
  "fitness apps",
  "budgeting apps",
  "language learning apps",
  "online grocery delivery",
  "dating apps",
  "travel booking",
  "kids activities",
  "meditation apps",
  // Work & side-hustle tools
  "freelance invoicing",
  "small online stores",
  "appointment scheduling",
  "email newsletters",
  "podcast editing",
  "resume builders",
  "tutoring services",
] as const;

/**
 * Return `count` niches starting at `offset` (wrapping around), so a shuffle
 * button can rotate through the whole list deterministically without
 * repeating until all have been seen.
 */
export function pickNiches(offset: number, count = 6): string[] {
  const list = NICHE_SUGGESTIONS;
  const start = ((offset % list.length) + list.length) % list.length;
  const out: string[] = [];
  for (let i = 0; i < Math.min(count, list.length); i++) {
    out.push(list[(start + i) % list.length]);
  }
  return out;
}
