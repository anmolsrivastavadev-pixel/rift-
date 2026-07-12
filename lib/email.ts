/* M27 — Transactional email via the Resend HTTP API (plain fetch, no SDK).
 *
 * Key-gated like Tavily: without RESEND_API_KEY the app builds and runs and
 * every email feature stays hidden (isEmailEnabled). EMAIL_FROM defaults to
 * Resend's shared onboarding sender, which works before any domain is
 * verified; switch to a branded sender once the domain is set up (runbook).
 *
 * Logs are metadata only — never API keys, never email bodies.
 */

import { logger } from "@/lib/logger";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Rift <onboarding@resend.dev>";

/* Brand tokens for email HTML. Mail clients strip <style> and CSS vars, so
 * these are inlined literals — keep them in sync with app/globals.css
 * (doodle rebrand, July 2026). */
const MAIL = {
  ink: "#3a3245",
  muted: "#5f5569",
  faint: "#8b8194",
  paper: "#fdf1e3",
  coral: "#cf4318",
} as const;

export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Send one email. Throws on failure so callers (e.g. Better Auth's reset
 * flow) can surface a generic error; the thrown message never contains
 * provider response text.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Email is not configured.");
  }
  const from = process.env.EMAIL_FROM || DEFAULT_FROM;

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    logger.error("email.send_failed", { to, subject, status: res.status, detail: detail.slice(0, 300) });
    throw new Error("Could not send the email.");
  }
  logger.info("email.sent", { to, subject });
}

/** M31c — Weekly niche watch digest content. Titles only, never complaint
 * bodies. Sent only to the verified account owner; managing the watch is one
 * click in-app, so there is no tokenised unsubscribe link. */
export function buildNicheWatchDigestEmail(input: {
  projectName: string;
  keyword: string;
  inserted: number;
  topComplaintTitles: string[];
  complaintsUrl: string;
  quotaFull: boolean;
}): { subject: string; html: string; text: string } {
  const { projectName, keyword, inserted, topComplaintTitles, complaintsUrl, quotaFull } =
    input;
  const subject = quotaFull
    ? `Rift niche watch: "${keyword}" found complaints, but the project is full`
    : `Rift niche watch: ${inserted} new complaint${inserted === 1 ? "" : "s"} about "${keyword}"`;

  const introText = quotaFull
    ? `Your weekly watch on "${keyword}" found new complaints, but the project "${projectName}" has reached its complaint limit, so nothing was added. Free up room (Start Fresh or a new project) or upgrade for more space.`
    : `Your weekly watch on "${keyword}" added ${inserted} new complaint${inserted === 1 ? "" : "s"} to the project "${projectName}".`;

  const titleLinesText = topComplaintTitles.map((t) => `- ${t}`).join("\n");
  const footerText =
    "You get this weekly because you watch this niche. Pause or delete the watch on your Complaints page.";

  const text = [
    introText,
    ...(topComplaintTitles.length > 0 ? ["", titleLinesText] : []),
    "",
    `Open the project: ${complaintsUrl}`,
    "",
    footerText,
  ].join("\n");

  const titleListHtml =
    topComplaintTitles.length > 0
      ? `<ul style="font-size: 14px; color: ${MAIL.ink}; padding-left: 20px;">${topComplaintTitles
          .map((t) => `<li style="margin-bottom: 6px;">${escapeHtml(t)}</li>`)
          .join("")}</ul>`
      : "";

  const html = mailShell(`
    <p style="font-size: 15px; margin: 0;">${escapeHtml(introText)}</p>
    ${titleListHtml}
    ${mailButton(complaintsUrl, "Open the project")}
    <p style="font-size: 13px; color: ${MAIL.muted}; margin: 0;">${escapeHtml(footerText)}</p>`);
  return { subject, html, text };
}

/* Shared cream-paper wrapper + coral sticker button, so both emails look
 * like the site. Inline styles only: mail clients drop stylesheets. */
function mailShell(inner: string): string {
  return `
  <div style="background: ${MAIL.paper}; padding: 32px 16px;">
    <div style="font-family: 'Nunito', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fffcf5; border: 2px solid rgba(58,50,69,0.16); border-radius: 20px; padding: 28px; color: ${MAIL.ink};">
      <p style="font-size: 22px; font-weight: 800; margin: 0 0 18px;">Rift<span style="color: ${MAIL.coral};">.</span></p>
      ${inner}
      <p style="font-size: 12px; color: ${MAIL.faint}; margin: 28px 0 0;">Rift: business ideas from real customer pain.</p>
    </div>
  </div>`;
}

function mailButton(url: string, label: string): string {
  return `
    <p style="margin: 24px 0;">
      <a href="${escapeHtml(url)}" style="display: inline-block; background: ${MAIL.coral}; color: #ffffff; text-decoration: none; padding: 12px 24px; border: 2px solid ${MAIL.ink}; border-radius: 999px; font-size: 14px; font-weight: 700;">${label}</a>
    </p>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** M27 — Password reset email content. `url` is Better Auth's signed link. */
export function buildResetPasswordEmail(url: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Reset your Rift password";
  const text = [
    "Someone (hopefully you) asked to reset the password for your Rift account.",
    "",
    `Reset it here: ${url}`,
    "",
    "The link expires in 1 hour. If you didn't ask for this, you can ignore this email. Your password stays unchanged.",
  ].join("\n");
  const html = mailShell(`
    <p style="font-size: 15px; margin: 0;">Someone (hopefully you) asked to reset the password for your Rift account.</p>
    ${mailButton(url, "Reset password")}
    <p style="font-size: 13px; color: ${MAIL.muted}; margin: 0;">The link expires in 1 hour. If you didn't ask for this, you can ignore this email. Your password stays unchanged.</p>`);
  return { subject, html, text };
}
