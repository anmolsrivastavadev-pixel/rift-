import type { Metadata } from "next";

/* The page itself is a client component, so its title/description live in
 * this passthrough layout (client components can't export metadata).
 */
export const metadata: Metadata = {
  title: "Create account",
  description: "Create your Rift account and turn complaints into ideas.",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
