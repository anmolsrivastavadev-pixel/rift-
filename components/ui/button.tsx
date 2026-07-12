import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-transparent text-sm font-semibold transition-all duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border-[#3a3245]/20 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary-fill),white_10%),var(--color-primary-fill))] text-[var(--color-primary-foreground)] shadow-[0_8px_24px_color-mix(in_srgb,var(--color-primary-fill),transparent_78%)] hover:brightness-110 hover:shadow-[0_10px_30px_color-mix(in_srgb,var(--color-primary-fill),transparent_70%)]",
        secondary:
          "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm hover:border-[#3a3245]/40 hover:brightness-[0.98]",
        ghost:
          "text-[var(--color-foreground)] hover:bg-[var(--color-surface)]",
        outline:
          "border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] hover:border-[#3a3245]/40 hover:bg-[var(--color-surface)]",
        danger:
          "bg-[var(--color-danger)] text-white shadow-sm hover:brightness-110 hover:shadow-md",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
