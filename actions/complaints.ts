"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { complaintRowSchema, type UploadResult } from "@/lib/schemas";

const MAX_ROWS = 5000;

// Column names (lowercased) we accept as the complaint text/body.
const BODY_KEYS = [
  "body",
  "complaint",
  "complaints",
  "review",
  "reviews",
  "feedback",
  "text",
  "message",
  "description",
  "comment",
  "content",
];
const TITLE_KEYS = ["title", "subject", "name", "summary"];
const DATE_KEYS = ["sourcedate", "date", "createdat", "timestamp", "created"];

function pickField(row: Record<string, unknown>, keys: string[]): string {
  for (const key of Object.keys(row)) {
    const lower = key.toLowerCase().trim();
    if (keys.includes(lower)) {
      const v = row[key];
      if (typeof v === "string" || typeof v === "number") return String(v);
    }
  }
  return "";
}

/* Server action: receives a form with a hidden "data" field containing the
 * JSON-encoded CSV rows (parsed by PapaParse on the client). Validates each
 * row with Zod and inserts the valid ones into the database. Invalid rows are
 * skipped and reported back with a clear reason.
 */
export async function uploadComplaints(
  _prev: UploadResult | null,
  formData: FormData
): Promise<UploadResult> {
  const raw = formData.get("data");
  let rows: unknown[] = [];
  try {
    rows = raw ? (JSON.parse(String(raw)) as unknown[]) : [];
  } catch {
    return { inserted: 0, skipped: 0, errors: [{ row: 0, reason: "Malformed data (not valid JSON)" }] };
  }

  if (!Array.isArray(rows)) {
    return { inserted: 0, skipped: 0, errors: [{ row: 0, reason: "No data received" }] };
  }
  if (rows.length === 0) {
    return { inserted: 0, skipped: 0, errors: [] };
  }

  const capped = rows.slice(0, MAX_ROWS);
  const errors: { row: number; reason: string }[] = [];
  const valid = [];

  for (let i = 0; i < capped.length; i++) {
    const row = capped[i] as Record<string, unknown>;
    const candidate = {
      title: pickField(row, TITLE_KEYS),
      body: pickField(row, BODY_KEYS),
      sourceDate: pickField(row, DATE_KEYS),
    };

    const parsed = complaintRowSchema.safeParse(candidate);
    if (parsed.success) {
      const { title, body, sourceDate } = parsed.data;
      valid.push({
        title: title && title.length ? title : body.slice(0, 80),
        body,
        sourceDate: sourceDate ? new Date(sourceDate) : null,
      });
    } else {
      const issue = parsed.error.issues[0];
      const field = String(issue?.path?.[0] ?? "?");
      errors.push({
        row: i + 2, // +2 => header row + 1-indexed
        reason: `[${field}] ${issue?.message ?? "Invalid row"}`,
      });
    }
  }

  const skipped = capped.length - valid.length;

  // If every single row failed because body was empty, it almost certainly
  // means the CSV has no recognised complaint-text column. Surface a clear,
  // single error instead of 220 identical ones.
  if (valid.length === 0 && errors.length > 0) {
    const firstRow = capped[0] as Record<string, unknown> | undefined;
    const cols = firstRow ? Object.keys(firstRow) : [];
    const allMissingBody = errors.every((e) => e.reason.includes("[body]"));
    if (allMissingBody) {
      return {
        inserted: 0,
        skipped: skipped,
        errors: [
          {
            row: 0,
            reason: `No recognised complaint-text column found. Detected columns: [${cols.join(", ") || "none"}]. Expected one of: ${BODY_KEYS.join(", ")}.`,
          },
        ],
      };
    }
  }

  // Insert in chunks to keep query size reasonable.
  const CHUNK = 500;
  for (let i = 0; i < valid.length; i += CHUNK) {
    const batch = valid.slice(i, i + CHUNK);
    await prisma.complaint.createMany({ data: batch });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/complaints");

  return { inserted: valid.length, skipped, errors };
}