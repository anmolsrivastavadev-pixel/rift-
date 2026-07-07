/* Pure helper: detect Next.js "Server Action was not found on the server"
 * errors. These are not bugs — they happen when a deploy (or dev-server
 * restart) replaces the app while a tab is still open: the old page holds
 * action IDs the new server no longer knows. The only real fix is a full page
 * reload, so error boundaries show a "Reload page" button for this case
 * instead of a retry that can never work.
 */

export function isStaleDeployError(
  error: { name?: string; message?: string } | null | undefined
): boolean {
  if (!error) return false;
  const text = `${error.name ?? ""} ${error.message ?? ""}`;
  return (
    error.name === "UnrecognizedActionError" ||
    text.includes("failed-to-find-server-action") ||
    (/server action/i.test(text) && /not found/i.test(text))
  );
}

export const STALE_DEPLOY_TITLE = "Rift was updated";
export const STALE_DEPLOY_MESSAGE =
  "This page was open while Rift got a new version. Reload to pick it up — nothing was lost.";
