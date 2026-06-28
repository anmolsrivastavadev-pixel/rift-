import { z } from "zod";

/* CSV row schema expected from an uploaded complaints file.
 * Minimal required columns: body (the complaint text).
 * Optional: title, sourceDate (ISO date string).
 * Unknown extra columns are ignored.
 */
export const complaintRowSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  body: z.string().trim().min(1).max(5000),
  sourceDate: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v))
    .refine(
      (v) => !v || !Number.isNaN(Date.parse(v)),
      "sourceDate must be a valid date"
    ),
});

export type ComplaintRow = z.infer<typeof complaintRowSchema>;

export const uploadResultSchema = z.object({
  inserted: z.number().int().min(0),
  skipped: z.number().int().min(0),
  errors: z.array(z.object({ row: z.number().int(), reason: z.string() })),
});

export type UploadResult = z.infer<typeof uploadResultSchema>;