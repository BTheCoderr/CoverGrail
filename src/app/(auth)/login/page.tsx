import Link from "next/link";
import type { Metadata } from "next";
import { LoginEmailForm } from "@/components/auth/LoginEmailForm";

export const metadata: Metadata = {
  title: "Sign in",
};

function parseRateLimitSeconds(raw?: string): number | undefined {
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function loginMessage(
  reason?: string,
  status?: string,
  rateSeconds?: number,
): string | null {
  switch (reason) {
    case "rate_limit":
      if (typeof rateSeconds === "number" && rateSeconds > 0) {
        return `Too many login link requests. Please wait about ${rateSeconds} seconds before trying again.`;
      }
      return "Too many login link requests. Please wait about one minute before trying again.";
    case "auth":
      return "Authentication failed. Please try again.";
    case "missing-env":
    case "invalid-supabase-url":
    case "invalid-url":
      return "Sign-in is temporarily unavailable. Please try again later.";
    case "auth-health-fetch-failed":
    case "fetch-failed":
      return "Sign-in diagnostics are temporarily unavailable, but you can still request an email link.";
    case "auth-health-non-200":
      return status
        ? "Sign-in diagnostics returned an unexpected response, but you can still request an email link."
        : "Sign-in diagnostics are temporarily unavailable, but you can still request an email link.";
    case "sign-in-with-otp-failed":
    case "sign-in-failed":
      return "We could not send the sign-in link. Please verify your email and try again.";
    case "missing_email":
      return "Please enter your email address.";
    default:
      return null;
  }
}

function normalizeLegacyErrorMessage(raw: string | null): string | null {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (value === "auth") return "Authentication failed. Please try again.";
  if (value === "missing_email") return "Please enter your email address.";
  return "Sign-in failed. Please try again.";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    sent?: string;
    check_email?: string;
    error?: string;
    reason?: string;
    detail?: string;
    status?: string;
    seconds?: string;
  }>;
}) {
  const params = await searchParams;

  const rateSeconds = parseRateLimitSeconds(params.seconds);
  const reasonMessage = loginMessage(params.reason, params.status, rateSeconds);

  const legacyRaw = params.error && !params.reason ? params.error : null;
  const legacyError = normalizeLegacyErrorMessage(legacyRaw);

  const alertText = reasonMessage ?? legacyError;

  const linkSentSuccess = params.sent === "1" || Boolean(params.check_email);

  const isDiagnosticSoft =
    params.reason === "auth-health-fetch-failed" ||
    params.reason === "auth-health-non-200" ||
    params.reason === "fetch-failed";

  const isRateLimit = params.reason === "rate_limit";

  const alertBoxClass =
    isDiagnosticSoft || isRateLimit
      ? "border border-amber-500/25 bg-amber-950/25 px-4 py-3 text-sm text-amber-100/95 whitespace-pre-wrap break-words"
      : "border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200 whitespace-pre-wrap break-words";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8">
        <h1 className="text-center text-2xl font-semibold text-zinc-50">
          Sign in to CoverGrail
        </h1>
        <p className="mt-3 text-center text-sm text-zinc-400">
          Sign in securely with a one-time link sent to your email.
        </p>

        {linkSentSuccess ? (
          <div className="mt-6 space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100/95">
            <p className="font-medium text-emerald-50">
              Login link sent. Check your email inbox and spam folder.
            </p>
            <p className="text-emerald-100/85">
              Do not request another link right away or Supabase may temporarily
              rate-limit you.
            </p>
          </div>
        ) : null}

        {alertText ? (
          <p className={`mt-6 rounded-xl ${alertBoxClass}`}>{alertText}</p>
        ) : null}

        <LoginEmailForm rateLimitCooldown={isRateLimit} linkJustSent={linkSentSuccess} />

        <p className="mt-8 text-center text-xs text-zinc-400">
          CoverGrail is not affiliated with CGC or CBCS and does not guarantee
          official grading outcomes.
        </p>
      </div>
      <Link
        href="/"
        className="mt-8 text-center text-sm text-zinc-400 hover:text-amber-400"
      >
        ← Back to landing
      </Link>
    </main>
  );
}
