import { DoodleLanding } from "@/components/landing/doodle";

/* Landing page (July 2026 doodle redesign — founder choice). The full
 * composition lives in components/landing/doodle.tsx; "/redesign" renders
 * the same component as an unlinked preview alias. Reading order is the
 * visitor's question order: what is this and what do I type (Hero) → how
 * does it work → show me one real result (Example) → where does the
 * evidence come from → can I trust the method → why not just ChatGPT →
 * remaining questions → sign up.
 */
export default function HomePage() {
  return <DoodleLanding />;
}
