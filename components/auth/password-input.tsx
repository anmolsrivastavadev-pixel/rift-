"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/* Password field with a show/hide toggle. Each form passes its own input
 * classes via `className`; this component only adds the right padding for
 * the eye button. Visibility resets to hidden on every mount.
 */
export function PasswordInput({
  id,
  name,
  value,
  onChange,
  required,
  minLength,
  autoComplete,
  className,
}: {
  id: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        className={`${className ?? ""} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--color-muted-foreground)] transition-colors duration-150 ease-out hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden />
        ) : (
          <Eye className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}
