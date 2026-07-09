import * as React from "react";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface DisclosureProps {
  title: React.ReactNode;
  suffix?: React.ReactNode;
  defaultOpen?: boolean;
  variant?: "card" | "dashed";
  className?: string;
  children: React.ReactNode;
}

const variantClass = {
  card: "bg-[var(--color-surface)]",
  dashed: "border-dashed bg-[var(--color-card)]",
};

export function Disclosure({
  title,
  suffix,
  defaultOpen = false,
  variant = "card",
  className,
  children,
}: DisclosureProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "group rounded-2xl border border-[var(--color-border)] p-5",
        variantClass[variant],
        className
      )}
    >
      <summary className="flex cursor-pointer select-none items-center gap-2 text-sm font-semibold transition-colors duration-150 ease-out marker:content-none hover:text-[var(--color-primary)] [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 ease-out group-open:rotate-90" />
        <span>{title}</span>
        {suffix && (
          <span className="font-normal text-[var(--color-muted-foreground)]">
            {suffix}
          </span>
        )}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}