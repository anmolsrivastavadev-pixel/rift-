import { z } from "zod";

/* Schema for a single cluster returned by Gemini. */
export const clusterSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(600),
  keywords: z.array(z.string().min(1).max(40)).min(1).max(10),
  industry: z.string().min(1).max(80),
  severity: z.number().min(1).max(10),
  confidence: z.number().min(0).max(100),
  suggestedSoftware: z.string().min(1).max(160),
  reason: z.string().min(1).max(1200),
  complaintIndices: z.array(z.number().int().min(0)).min(1),
});

/* Full Gemini response: a list of clusters. */
export const clustersResponseSchema = z.object({
  clusters: z.array(clusterSchema),
});

export type Cluster = z.infer<typeof clusterSchema>;
export type ClustersResponse = z.infer<typeof clustersResponseSchema>;

/* Cleaned complaint passed to the AI pipeline. */
export const cleanedComplaintSchema = z.object({
  id: z.string(),
  text: z.string().min(1).max(2000),
});
export type CleanedComplaint = z.infer<typeof cleanedComplaintSchema>;