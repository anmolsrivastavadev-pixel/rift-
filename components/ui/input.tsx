import * as React from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-foreground)] shadow-[var(--shadow-card)] placeholder:text-[var(--color-muted-foreground)] outline-none transition-all duration-150 ease-out hover:border-[#3a3245]/40 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:cursor-not-allowed disabled:opacity-50";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon: Icon, type = "text", ...props }, ref) => {
    if (!Icon) {
      return (
        <input
          ref={ref}
          type={type}
          className={cn(fieldClass, className)}
          {...props}
        />
      );
    }

    return (
      <div className="relative w-full">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <input
          ref={ref}
          type={type}
          className={cn(fieldClass, "pl-9", className)}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          fieldClass,
          "h-auto min-h-24 resize-y py-2",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(fieldClass, "appearance-none pr-8", className)}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
      </div>
    );
  }
);
NativeSelect.displayName = "NativeSelect";

export { Input, Textarea, NativeSelect, fieldClass };
