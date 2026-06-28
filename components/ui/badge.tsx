import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)]",
        primary:
          "border-transparent bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
        success:
          "border-transparent bg-[var(--color-success)]/10 text-[var(--color-success)]",
        warning:
          "border-transparent bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
        danger:
          "border-transparent bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };