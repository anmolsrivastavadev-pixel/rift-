"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function ComplaintSearch({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function commit(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("q", value);
    else next.delete("q");
    next.delete("page");
    router.replace(`/dashboard/complaints?${next.toString()}`);
  }

  // Debounce URL updates so each keystroke doesn't refetch the whole list.
  function schedule(value: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => commit(value), 300);
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-sm">
      <Input
        type="search"
        icon={Search}
        defaultValue={initial}
        onChange={(e) => schedule(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            commit(e.currentTarget.value);
          }
        }}
        placeholder="Search complaints…"
        aria-label="Search complaints"
      />
    </div>
  );
}
