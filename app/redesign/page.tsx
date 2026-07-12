import type { Metadata } from "next";

import { DoodleLanding } from "@/components/landing/doodle";

/* /redesign — preview alias of the landing page. The doodle redesign
 * auditioned here in July 2026 and was promoted to "/"; the route stays
 * as the staging ground for future auditions. Never linked, noindexed.
 */

export const metadata: Metadata = {
  title: "Rift — redesign preview",
  robots: { index: false, follow: false },
};

export default function RedesignPreviewPage() {
  return <DoodleLanding />;
}
