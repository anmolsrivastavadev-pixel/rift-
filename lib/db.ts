import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

/* Neon pauses idle databases and NAT/laptop-sleep can silently kill sockets,
 * so a long-lived pool may hold connections that are already dead — the next
 * query then fails with "Server has closed the connection". Two defenses:
 *
 * 1. Pool hygiene: drop idle sockets quickly (before anything upstream kills
 *    them), TCP keepalive to detect dead peers, and a bounded connect wait so
 *    a cold-starting database fails loud instead of hanging forever.
 * 2. Read retry: retry read-only operations exactly once when the error is a
 *    dropped connection (the retry dials a fresh socket). Writes are never
 *    retried — a write on a dying connection could have committed, and
 *    retrying it might duplicate data.
 */

const RETRYABLE_READ_OPS = new Set([
  "findMany",
  "findFirst",
  "findUnique",
  "findFirstOrThrow",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

function isDroppedConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return (
    message.includes("Server has closed the connection") ||
    message.includes("Connection terminated") ||
    message.includes("Connection reset") ||
    message.includes("ECONNRESET")
  );
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    keepAlive: true,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
  });
  const base = new PrismaClient({ adapter });
  return base.$extends({
    query: {
      $allOperations: async ({ operation, query, args }) => {
        try {
          return await query(args);
        } catch (error) {
          if (RETRYABLE_READ_OPS.has(operation) && isDroppedConnectionError(error)) {
            // Brief pause so the fresh connection lands after the old socket
            // is fully torn down (and Neon has a moment to wake).
            await new Promise((resolve) => setTimeout(resolve, 300));
            return query(args);
          }
          throw error;
        }
      },
    },
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
