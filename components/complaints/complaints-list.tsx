import { prisma } from "@/lib/db";
import { ComplaintsTable } from "@/components/complaints/complaints-table";
import { ComplaintSearch } from "@/components/complaints/complaint-search";

export async function ComplaintsList({ query }: { query: string }) {
  const rows = await prisma.complaint.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <ComplaintSearch initial={query} />
      <ComplaintsTable rows={rows} hasQuery={Boolean(query)} />
    </div>
  );
}