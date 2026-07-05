import { SignInForm } from "@/components/auth/sign-in-form";
import { isEmailEnabled } from "@/lib/email";

/* M27 — thin server wrapper: the form itself lives in
 * components/auth/sign-in-form.tsx; this page only decides whether the
 * "Forgot password?" link can actually do anything (RESEND_API_KEY set).
 */
export default function SignInPage() {
  return <SignInForm resetEnabled={isEmailEnabled()} />;
}
