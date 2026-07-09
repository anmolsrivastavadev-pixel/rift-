import { createAuthClient } from "better-auth/client";

const appUrl = process.env.NEXT_PUBLIC_APP_URL;

export const authClient = createAuthClient(appUrl ? { baseURL: appUrl } : {});
