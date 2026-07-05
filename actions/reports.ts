"use server";

import { requireUser } from "@/lib/auth/current-user";
import {
  buildProjectReport,
  buildIdeaReport,
  slugifyForFilename,
} from "@/lib/reports";
import { getIdeaReportData, getProjectReportData } from "@/lib/report-data";
import { trackProductEvent } from "@/lib/product-events";

/* M18 — Private Markdown export.
 *
 * Both actions verify ownership server-side (the data queries in
 * lib/report-data.ts filter by id + userId) before returning anything, so a
 * forged id from the client only ever returns an error. Reports contain only
 * data already stored for THIS user and THIS project — no other projects, no
 * other users, no new AI calls. Nothing is saved to the database.
 *
 * M29 — data assembly moved verbatim to lib/report-data.ts so the public
 * share page renders from the same source of truth. The Markdown output is
 * unchanged.
 */

export type ExportResult =
  | { ok: true; markdown: string; filename: string }
  | { ok: false; error: string };

export async function getProjectReport(projectId: string): Promise<ExportResult> {
  const user = await requireUser();

  const data = await getProjectReportData(user.id, projectId);
  if (!data) {
    return { ok: false, error: "Project not found." };
  }

  const markdown = buildProjectReport(data);

  // M19 — event metadata only; the report contents are never logged.
  await trackProductEvent({
    userId: user.id,
    projectId: data.projectId,
    type: "project_exported",
  });

  return {
    ok: true,
    markdown,
    filename: `rift-project-${slugifyForFilename(data.projectName)}.md`,
  };
}

export async function getIdeaReport(opportunityId: string): Promise<ExportResult> {
  const user = await requireUser();

  const data = await getIdeaReportData(user.id, opportunityId);
  if (!data) {
    return { ok: false, error: "Idea not found." };
  }

  const markdown = buildIdeaReport(data);

  // M19 — event metadata only; the report contents are never logged.
  await trackProductEvent({
    userId: user.id,
    projectId: data.projectId,
    opportunityId: data.opportunityId,
    type: "idea_exported",
  });

  return {
    ok: true,
    markdown,
    filename: `rift-idea-${slugifyForFilename(data.title)}.md`,
  };
}
