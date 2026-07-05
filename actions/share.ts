"use server";

import { randomBytes } from "crypto";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/current-user";
import { shareUrlForToken } from "@/lib/share";
import { trackProductEvent } from "@/lib/product-events";

/* M29 — Public share links for project and idea reports.
 *
 * Ownership is verified server-side before any link is touched. One LIVE
 * link per target: creating again returns the existing link instead of
 * minting endless URLs; revoking sets revokedAt, after which the public page
 * 404s. Tokens are 32 hex chars from crypto.randomBytes(16) — unguessable,
 * and never reused after revocation (a fresh create mints a fresh token).
 */

export type ShareLinkKind = "project" | "idea";

export type ShareLinkResult =
  | { ok: true; linkId: string; url: string }
  | { ok: false; error: string };

export type RevokeShareLinkResult = { ok: true } | { ok: false; error: string };

async function verifyOwnership(
  userId: string,
  kind: ShareLinkKind,
  targetId: string
): Promise<boolean> {
  if (kind === "project") {
    const project = await prisma.project.findFirst({
      where: { id: targetId, userId },
      select: { id: true },
    });
    return project !== null;
  }
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: targetId, userId },
    select: { id: true },
  });
  return opportunity !== null;
}

export async function createShareLink(
  kind: ShareLinkKind,
  targetId: string
): Promise<ShareLinkResult> {
  const user = await requireUser();

  if (kind !== "project" && kind !== "idea") {
    return { ok: false, error: "Unknown share type." };
  }
  if (!targetId) {
    return { ok: false, error: "Nothing to share." };
  }
  if (!(await verifyOwnership(user.id, kind, targetId))) {
    return { ok: false, error: kind === "project" ? "Project not found." : "Idea not found." };
  }

  const targetWhere =
    kind === "project" ? { projectId: targetId } : { opportunityId: targetId };

  // Reuse the live link for this target if there is one.
  const existing = await prisma.shareLink.findFirst({
    where: { userId: user.id, kind, revokedAt: null, ...targetWhere },
    select: { id: true, token: true },
  });
  if (existing) {
    return { ok: true, linkId: existing.id, url: shareUrlForToken(existing.token) };
  }

  const token = randomBytes(16).toString("hex");
  const link = await prisma.shareLink.create({
    data: { token, kind, userId: user.id, ...targetWhere },
    select: { id: true, token: true },
  });

  await trackProductEvent({
    userId: user.id,
    projectId: kind === "project" ? targetId : undefined,
    opportunityId: kind === "idea" ? targetId : undefined,
    type: "share_link_created",
    metadata: { kind },
  });

  return { ok: true, linkId: link.id, url: shareUrlForToken(link.token) };
}

export async function revokeShareLink(linkId: string): Promise<RevokeShareLinkResult> {
  const user = await requireUser();

  const link = await prisma.shareLink.findFirst({
    where: { id: linkId, userId: user.id },
    select: { id: true, kind: true, projectId: true, opportunityId: true, revokedAt: true },
  });
  if (!link) {
    return { ok: false, error: "Share link not found." };
  }
  if (!link.revokedAt) {
    await prisma.shareLink.update({
      where: { id: link.id },
      data: { revokedAt: new Date() },
    });
    await trackProductEvent({
      userId: user.id,
      projectId: link.projectId,
      opportunityId: link.opportunityId,
      type: "share_link_revoked",
      metadata: { kind: link.kind },
    });
  }
  return { ok: true };
}
