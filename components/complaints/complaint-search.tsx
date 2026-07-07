"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function ComplaintSearch({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function update(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("q", value);
    else next.delete("q");
    next.delete("page");
    router.replace(`/dashboard/complaints?${next.toString()}`);
  }

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
      <input
        type="search"
        defaultValue={initial}
        onChange={(e) => update(e.target.value)}
        placeholder="Search complaints…"
        className="h-10 w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] pl-9 pr-3 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
      />
    </div>
  );
}
