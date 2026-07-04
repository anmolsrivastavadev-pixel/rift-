// Rift — M16A backfill script. One-off. Safe to delete after a successful run.
//
// Purpose:
//   After adding the nullable `projectId` column to Complaint, Opportunity, and
//   SavedOpportunity (and the new Project model) via `prisma db push`, every
//   existing user's rows still have `projectId = NULL`. This script gives every
//   existing user exactly one "Default project" and assigns all their existing
//   data (where projectId IS NULL) to that project so existing workflows keep
//   working identically.
//
// Rules (per M16A spec):
//   - Never assign data across users. Only rows whose `userId` matches the
//     project owner are updated.
//   - Leave legacy rows with `userId = NULL` alone (untouched).
//   - Never delete anything. Never run a destructive command.
//   - Idempotent: if a user already has a "Default project", reuse it; if all
//     their rows already have a projectId, this script is a no-op for them.
//
// Run:
//   node scripts/backfill-default-projects.mjs
//
// This script is NOT part of the build pipeline (intentionally not added to
// package.json scripts). Uses raw `pg` queries directly so it does not need the
// Prisma client (which is TypeScript-only under the driver adapter setup).
import "dotenv/config";
import pg from "pg";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

const DEFAULT_NAME = "Default project";

async function main() {
  await client.connect();
  const { rows: users } = await client.query(
    `SELECT id, email FROM "User" ORDER BY "createdAt" ASC`
  );
  console.log(`Found ${users.length} user(s).`);

  let totalComplaints = 0;
  let totalOpportunities = 0;
  let totalSaved = 0;
  let projectsCreated = 0;

  for (const user of users) {
    let project = (
      await client.query(
        `SELECT id FROM "Project" WHERE "userId" = $1 AND name = $2 LIMIT 1`,
        [user.id, DEFAULT_NAME]
      )
    ).rows[0];

    if (!project) {
      project = (
        await client.query(
          `INSERT INTO "Project" (id, name, "userId", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())
           RETURNING id`,
          [DEFAULT_NAME, user.id]
        )
      ).rows[0];
      projectsCreated++;
    }

    const c = await client.query(
      `UPDATE "Complaint" SET "projectId" = $1
       WHERE "userId" = $2 AND "projectId" IS NULL`,
      [project.id, user.id]
    );
    const o = await client.query(
      `UPDATE "Opportunity" SET "projectId" = $1
       WHERE "userId" = $2 AND "projectId" IS NULL`,
      [project.id, user.id]
    );
    const s = await client.query(
      `UPDATE "SavedOpportunity" SET "projectId" = $1
       WHERE "userId" = $2 AND "projectId" IS NULL`,
      [project.id, user.id]
    );

    totalComplaints += c.rowCount;
    totalOpportunities += o.rowCount;
    totalSaved += s.rowCount;

    console.log(
      `  ${user.email ?? user.id}: project=${project.id} complaints=${c.rowCount} opportunities=${o.rowCount} saved=${s.rowCount}`
    );
  }

  console.log("Backfill complete.");
  console.log(`  Projects created: ${projectsCreated}`);
  console.log(`  Complaints updated: ${totalComplaints}`);
  console.log(`  Opportunities updated: ${totalOpportunities}`);
  console.log(`  SavedOpportunities updated: ${totalSaved}`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });
