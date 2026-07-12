import * as React from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorPanelProps {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ErrorPanel({
  title,
  message,
  onRetry,
  retryLabel = "Try again",
  children,
  className,
}: ErrorPanelProps) {
  return (
    /* <main id="main-content"> so the layout's "Skip to main content" link has
       a target on error routes too — it previously jumped nowhere here. */
    <main
      id="main-content"
      className={cn(
        "mx-auto max-w-md space-y-6 py-24 text-center",
        className
      )}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-danger)]/10 text-[var(--color-danger)]">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} className="mx-auto">
          {retryLabel}
        </Button>
      )}
      {children}
    </main>
  );
}