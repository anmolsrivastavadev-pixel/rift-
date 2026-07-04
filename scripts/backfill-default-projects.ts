// Rift M16A one-off backfill. Do not add this to build scripts.
//
// Creates a "Default project" for users who have no projects, then assigns that
// user's existing rows with null projectId to that user's project. Rows with
// userId null are intentionally left untouched. This script never deletes data.
//
// Run once after the M16A schema is synced locally:
//   node --experimental-strip-types scripts/backfill-default-projects.ts

import "dotenv/config";
import { randomUUID } from "node:crypto";
import pg from "pg";

const { Client } = pg;
const DEFAULT_PROJECT_NAME = "Default project";

type UserRow = {
  id: string;
};

type ProjectRow = {
  id: string;
  name: string;
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to run the backfill.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const usersResult = await client.query<UserRow>(
      `SELECT id FROM "User" ORDER BY "createdAt" ASC`
    );

    let projectsCreated = 0;
    let reusedExistingProjects = 0;
    let complaintsUpdated = 0;
    let opportunitiesUpdated = 0;
    let savedUpdated = 0;

    for (const user of usersResult.rows) {
      const projectsResult = await client.query<ProjectRow>(
        `SELECT id, name FROM "Project" WHERE "userId" = $1 ORDER BY "createdAt" ASC`,
        [user.id]
      );

      let project = projectsResult.rows.find(
        (candidate) => candidate.name === DEFAULT_PROJECT_NAME
      );

      if (!project && projectsResult.rows.length === 0) {
        const created = await client.query<ProjectRow>(
          `INSERT INTO "Project" (id, name, "userId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW())
           RETURNING id, name`,
          [randomUUID(), DEFAULT_PROJECT_NAME, user.id]
        );
        project = created.rows[0];
        projectsCreated += 1;
      }

      if (!project) {
        project = projectsResult.rows[0];
        reusedExistingProjects += 1;
      }

      const complaints = await client.query(
        `UPDATE "Complaint"
         SET "projectId" = $1
         WHERE "userId" = $2 AND "projectId" IS NULL`,
        [project.id, user.id]
      );
      const opportunities = await client.query(
        `UPDATE "Opportunity"
         SET "projectId" = $1
         WHERE "userId" = $2 AND "projectId" IS NULL`,
        [project.id, user.id]
      );
      const saved = await client.query(
        `UPDATE "SavedOpportunity"
         SET "projectId" = $1
         WHERE "userId" = $2 AND "projectId" IS NULL`,
        [project.id, user.id]
      );

      complaintsUpdated += complaints.rowCount ?? 0;
      opportunitiesUpdated += opportunities.rowCount ?? 0;
      savedUpdated += saved.rowCount ?? 0;

      console.log(
        `user=${user.id} project=${project.id} complaints=${complaints.rowCount ?? 0} opportunities=${opportunities.rowCount ?? 0} saved=${saved.rowCount ?? 0}`
      );
    }

    console.log("Backfill complete.");
    console.log(`Users processed: ${usersResult.rowCount}`);
    console.log(`Projects created: ${projectsCreated}`);
    console.log(`Existing projects reused: ${reusedExistingProjects}`);
    console.log(`Complaints updated: ${complaintsUpdated}`);
    console.log(`Opportunities updated: ${opportunitiesUpdated}`);
    console.log(`SavedOpportunities updated: ${savedUpdated}`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Backfill failed: ${message}`);
  process.exitCode = 1;
});
