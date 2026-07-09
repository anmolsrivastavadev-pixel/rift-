import { requireUser } from "@/lib/auth/current-user";
import { hasBetaAccess } from "@/lib/beta-access";

export const BETA_BLOCKED_MESSAGE =
  "Your beta access is not active. Ask the founder if you think this is a mistake.";

export class BetaAccessError extends Error {
  constructor() {
    super(BETA_BLOCKED_MESSAGE);
    this.name = "BetaAccessError";
  }
}

type ActionUser = { id: string; email: string };

/**
 * Shared server-action guard: signed in + still allowed into the beta.
 * Missing sign-in still redirects through requireUser(); revoked beta access
 * throws so actions can return their normal error shape.
 */
export async function requireActor(): Promise<ActionUser> {
  const user = await requireUser();
  if (!(await hasBetaAccess(user))) {
    throw new BetaAccessError();
  }
  return user;
}
