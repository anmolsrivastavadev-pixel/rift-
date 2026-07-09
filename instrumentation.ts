import { logger } from "@/lib/logger";

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

export async function register(): Promise<void> {
  try {
    const missing = ["DATABASE_URL", "BETTER_AUTH_SECRET", "GEMINI_API_KEY"].filter(
      (name) => !present(name)
    );
    if (missing.length > 0) {
      logger.warn("env.missing", { vars: missing.join(",") });
    }

    const stripeVars = ["STRIPE_SECRET_KEY", "STRIPE_PRICE_PRO_MONTHLY", "STRIPE_WEBHOOK_SECRET"];
    const stripeSet = stripeVars.filter(present);
    if (stripeSet.length > 0 && stripeSet.length < stripeVars.length) {
      logger.warn("env.stripe_partial", {
        message: "Stripe partially configured; billing disabled until all three Stripe vars are set.",
      });
    }

    if (process.env.RIFT_BETA_MODE === "invite_only" && !present("RIFT_ADMIN_EMAILS")) {
      logger.warn("env.beta_no_admins", {
        message: "No admins configured; invite-only beta mode will lock everyone out.",
      });
    }

    if (!present("CRON_SECRET")) {
      logger.warn("env.cron_secret_missing", {
        message: "CRON_SECRET is missing; niche watches will never run.",
      });
    }

    if (process.env.NODE_ENV === "production" && !present("NEXT_PUBLIC_APP_URL")) {
      logger.info("env.next_public_app_url_missing", {
        message: "NEXT_PUBLIC_APP_URL is unset; browser auth client will use same-origin /api/auth.",
      });
    }
  } catch (err) {
    logger.warn("env.sanity_check_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
