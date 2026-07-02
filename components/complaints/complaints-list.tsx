import { prisma } from "@/lib/db";
import { ComplaintsTable } from "@/components/complaints/complaints-table";
import { ComplaintSearch } from "@/components/complaints/complaint-search";
import { requireUser } from "@/lib/auth/current-user";

export async function ComplaintsList({ query }: { query: string }) {
  const user = await requireUser();
  const rows = await prisma.complaint.findMany({
    where: {
      userId: user.id,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { body: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
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