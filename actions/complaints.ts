"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { complaintRowSchema, type UploadResult } from "@/lib/schemas";
import { parseComplaintsFromText, normaliseBodyForKey } from "@/lib/text-import";

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

function insertValidRows(
  valid: { title: string; body: string; sourceDate: Date | null }[]
): Promise<unknown> {
  const CHUNK = 500;
  const inserts = [];
  for (let i = 0; i < valid.length; i += CHUNK) {
    const batch = valid.slice(i, i + CHUNK);
    inserts.push(prisma.complaint.createMany({ data: batch }));
  }
  return Promise.all(inserts);
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
  await insertValidRows(valid);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/complaints");

  return { inserted: valid.length, skipped, errors };
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------
// Same fictional complaints as /public/sample_complaints.csv.
// Used by the "Use demo data" button on the upload page so a new user can
// explore Rift without having to source or format their own CSV first.
// ---------------------------------------------------------------------------
const DEMO_ROWS: { title: string; body: string; sourceDate: string }[] = [
  { title: "Slow login", body: "The login page takes forever to load and sometimes times out.", sourceDate: "2025-01-04" },
  { title: "App crashes on startup", body: "Every time I open the app it crashes within ten seconds please fix this.", sourceDate: "2025-01-08" },
  { title: "Bad export", body: "Exporting my data to CSV fails silently and I lose hours of work.", sourceDate: "2025-01-09" },
  { title: "Confusing onboarding", body: "The onboarding flow is impossible to understand I had to watch three tutorials.", sourceDate: "2025-01-12" },
  { title: "Mobile layout broken", body: "The mobile layout is completely broken half the screen is cut off.", sourceDate: "2025-01-15" },
  { title: "No dark mode", body: "Why is there no dark mode in 2025 this is unacceptable.", sourceDate: "2025-01-18" },
  { title: "Slow search", body: "Search takes 15 seconds to return results and I have a fast connection.", sourceDate: "2025-01-22" },
  { title: "Bad notifications", body: "The notification settings reset every time I log out extremely frustrating.", sourceDate: "2025-01-25" },
  { title: "Pricing too high", body: "Your pricing doubled overnight with no warning this is unacceptable.", sourceDate: "2025-01-28" },
  { title: "Crashes on big files", body: "The app crashes whenever I upload files larger than 50MB.", sourceDate: "2025-02-02" },
];

export async function loadDemoComplaints(): Promise<UploadResult> {
  const valid: { title: string; body: string; sourceDate: Date | null }[] = [];
  const errors: { row: number; reason: string }[] = [];

  for (let i = 0; i < DEMO_ROWS.length; i++) {
    const parsed = complaintRowSchema.safeParse(DEMO_ROWS[i]);
    if (parsed.success) {
      const { title, body, sourceDate } = parsed.data;
      valid.push({
        title: title && title.length ? title : body.slice(0, 80),
        body,
        sourceDate: sourceDate ? new Date(sourceDate) : null,
      });
    } else {
      errors.push({
        row: i + 2,
        reason: parsed.error.issues[0]?.message ?? "Invalid row",
      });
    }
  }

  if (valid.length === 0) {
    return { inserted: 0, skipped: DEMO_ROWS.length, errors };
  }

  // Never insert duplicate demo rows. Match on the exact demo body text so
  // re-clicking "Use demo data" is idempotent: only complaints that are not
  // already present get inserted. This is a demo-data convenience and does
  // not affect the regular CSV upload pipeline.
  const demoBodies = valid.map((r) => r.body);
  const existing = await prisma.complaint.findMany({
    where: { body: { in: demoBodies } },
    select: { body: true },
  });
  const existingBodies = new Set(existing.map((c) => c.body));
  const toInsert = valid.filter((r) => !existingBodies.has(r.body));

  if (toInsert.length > 0) {
    await insertValidRows(toInsert);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/complaints");

  // inserted === 0 means every demo row is already present, which the UI uses
  // to show the "already loaded" message. skipped counts rows that were
  // skipped because they were already in the database (not validation skips).
  return {
    inserted: toInsert.length,
    skipped: valid.length - toInsert.length,
    errors,
  };
}

/* -------------------------------------------------------------------------
 * Text import (paste text / upload .txt or .md)
 * -------------------------------------------------------------------------
 * Shares the same Zod schema and the same insertValidRows helper as the CSV
 * upload path. Parsing lives in lib/text-import.ts (pure functions). The AI
 * pipeline is not touched and is not auto-run; the user clicks "Run AI
 * clustering" after a successful import.
 */
export async function importTextComplaints(
  _prev: UploadResult | null,
  formData: FormData
): Promise<UploadResult> {
  const text = String(formData.get("text") ?? "");

  if (!text.trim()) {
    return {
      inserted: 0,
      skipped: 0,
      errors: [{ row: 0, reason: "No text provided." }],
    };
  }

  const parsed = parseComplaintsFromText(text);

  if (parsed.length === 0) {
    return {
      inserted: 0,
      skipped: 0,
      errors: [
        {
          row: 0,
          reason:
            "No usable complaints found. Paste one complaint per line or separate complaints with blank lines.",
        },
      ],
    };
  }

  const capped = parsed.slice(0, MAX_ROWS);
  const errors: { row: number; reason: string }[] = [];
  const valid: { title: string; body: string; sourceDate: Date | null }[] = [];

  for (let i = 0; i < capped.length; i++) {
    // Reuse the existing Zod schema so min/max length rules stay in one place.
    const z = complaintRowSchema.safeParse({ body: capped[i].body });
    if (z.success) {
      valid.push({
        title: capped[i].title,
        body: z.data.body,
        sourceDate: null,
      });
    } else {
      errors.push({
        row: i + 1,
        reason: z.error.issues[0]?.message ?? "Invalid entry",
      });
    }
  }

  if (valid.length === 0) {
    return { inserted: 0, skipped: capped.length, errors };
  }

  // Never insert complaints that are already in the database. Comparison is
  // case- AND whitespace-insensitive (trim + lowercase + collapse internal
  // whitespace to single spaces), so a stored "The onboarding takes way too
  // long." also blocks an incoming "the ONBOARDING takes  way too long.".
  // Stored bodies keep their original user-submitted form; only the
  // comparison key is normalised. M8 text import only — CSV upload does not
  // dedupe against the DB and is unaffected. For MVP-scale workspaces a
  // single select-bodies scan is cheap and matches the pipeline's own
  // `prisma.complaint.findMany` usage.
  const all = await prisma.complaint.findMany({ select: { body: true } });
  const existingKeys = new Set(all.map((c) => normaliseBodyForKey(c.body)));
  const toInsert = valid.filter(
    (r) => !existingKeys.has(normaliseBodyForKey(r.body))
  );

  // skipped = everything we did not insert: too-short/invalid + in-batch
  // duplicates (already removed by the parser) + bodies already in the DB.
  const skipped = capped.length - toInsert.length;

  if (toInsert.length > 0) {
    await insertValidRows(toInsert);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/complaints");

  // inserted === 0 with no errors means every parsed complaint was already
  // loaded — the UI surfaces an informational "already loaded" message.
  return { inserted: toInsert.length, skipped, errors };
}