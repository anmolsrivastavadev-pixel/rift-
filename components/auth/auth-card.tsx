import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div
        className={cn(
          "w-full max-w-sm space-y-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[var(--shadow-card)]",
          className
        )}
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              {title}
            </Link>
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              {subtitle}
            </p>
          )}
        </div>
        {children}
        {footer && (
          <p className="text-center text-sm text-[var(--color-muted-foreground)]">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}