import type { Metadata } from "next";

/* The page itself is a client component, so its title/description live in
 * this passthrough layout (client components can't export metadata).
 */
export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your Rift account.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
