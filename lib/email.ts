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
  const html = `
  <div style="font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #18181b;">
    <p style="font-size: 15px;">Someone (hopefully you) asked to reset the password for your Rift account.</p>
    <p style="margin: 24px 0;">
      <a href="${url}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 600;">Reset password</a>
    </p>
    <p style="font-size: 13px; color: #52525b;">The link expires in 1 hour. If you didn't ask for this, you can ignore this email. Your password stays unchanged.</p>
    <p style="font-size: 12px; color: #a1a1aa; margin-top: 32px;">Rift: business ideas from real customer pain.</p>
  </div>`;
  return { subject, html, text };
}
