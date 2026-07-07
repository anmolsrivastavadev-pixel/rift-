import { ExternalLink as ExternalLinkIcon } from "lucide-react";

/* M31a — the app's one pattern for links that leave Rift (receipt links to
 * original complaint posts). Always opens in a new tab with the referrer
 * stripped. Keep every outbound link on this component so the treatment stays
 * consistent. */
export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 underline underline-offset-2 hover:text-[var(--color-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${className}`}
    >
      {children}
      <ExternalLinkIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
    </a>
  );
}
