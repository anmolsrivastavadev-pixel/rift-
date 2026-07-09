import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NoticeVariant = "success" | "warning" | "danger" | "info";

interface NoticeProps {
  variant: NoticeVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const variantConfig: Record<
  NoticeVariant,
  { border: string; bg: string; icon: LucideIcon; iconColor: string; role?: string; ariaLive?: "polite" }
> = {
  success: {
    border: "border-[var(--color-success)]/40",
    bg: "bg-[var(--color-success-soft)]",
    icon: CheckCircle2,
    iconColor: "text-[var(--color-success)]",
    ariaLive: "polite",
  },
  warning: {
    border: "border-[var(--color-warning)]/40",
    bg: "bg-[var(--color-warning-soft)]",
    icon: AlertTriangle,
    iconColor: "text-[var(--color-warning)]",
    role: "alert",
  },
  danger: {
    border: "border-[var(--color-danger)]/40",
    bg: "bg-[var(--color-danger-soft)]",
    icon: AlertCircle,
    iconColor: "text-[var(--color-danger)]",
    role: "alert",
  },
  info: {
    border: "border-[var(--color-primary)]/40",
    bg: "bg-[var(--color-primary-soft)]",
    icon: Info,
    iconColor: "text-[var(--color-primary)]",
    ariaLive: "polite",
  },
};

export function Notice({
  variant,
  title,
  children,
  className,
}: NoticeProps) {
  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return (
    <div
      role={cfg.role}
      aria-live={cfg.ariaLive}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 text-sm",
        cfg.border,
        cfg.bg,
        className
      )}
    >
      <Icon
        className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.iconColor)}
      />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-medium">{title}</p>}
        {children && (
          <div className="text-[var(--color-muted-foreground)]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}