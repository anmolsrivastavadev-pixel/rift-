import type { Metadata } from "next";

/* The page itself is a client component, so its title/description live in
 * this passthrough layout (client components can't export metadata).
 * noindex: reset links carry one-time tokens and should never be indexed.
 */
export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your Rift account.",
  robots: { index: false },
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
