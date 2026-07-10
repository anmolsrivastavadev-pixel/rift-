import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Idea not found</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        The idea you&rsquo;re looking for doesn&rsquo;t exist or was reset.
      </p>
      <Button asChild>
        <Link href="/dashboard/opportunities">Back to ideas</Link>
      </Button>
    </div>
  );
}