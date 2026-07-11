/* Public support/contact email shown on the privacy, terms, and beta-access
 * pages. Not a secret — it's meant to be displayed. Defaults to the founder's
 * address so it renders on production without any Vercel env step; an env
 * override lets it change later without a code edit.
 */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "anmol.srivastava.dev@gmail.com";
