import Link from "next/link";
import type { Metadata } from "next";
import { LoginEmailForm } from "@/components/auth/LoginEmailForm";

export const metadata: Metadata = {
  title: "Sign in",
};

function safeDecodeQuery(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function parseRateLimitSeconds(raw?: string): number | undefined {
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function loginMessage(
  reason?: string,
  detail?: string,
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
      return (
        "missing-env: No Supabase URL or public API key on this server. In Netlify → Environment variables, set " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy JWT `eyJ…` or publishable `sb_publishable_…` in the same variable). " +
        "Clear-cache redeploy after changes."
      );
    case "invalid-supabase-url":
    case "invalid-url":
      return "invalid-supabase-url: NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Fix it and redeploy.";
    case "auth-health-fetch-failed":
    case "fetch-failed":
      return (
        "Diagnostics could not reach Supabase Auth, but you can still try sending a magic link. " +
        `(Technical detail: ${detail ? safeDecodeQuery(detail).slice(0, 200) : "network"}.)`
      );
    case "auth-health-non-200":
      return (
        "Diagnostics could not reach Supabase Auth (unexpected HTTP status), but you can still try sending a magic link. " +
        `(HTTP ${status ?? "?"}.)`
      );
    case "sign-in-with-otp-failed":
    case "sign-in-failed":
      return `sign-in-with-otp-failed: ${detail ? safeDecodeQuery(detail) : "Magic link request failed."}`;
    case "missing_email":
      return "Please enter your email address.";
    default:
      return null;
  }
}

/** Legacy ?error=auth from /auth/callback should not display as the literal "auth". */
function normalizeLegacyErrorMessage(decoded: string | null): string | null {
  if (!decoded) return null;
  const t = decoded.trim();
  if (t.toLowerCase() === "auth") {
    return "Authentication failed. Please try again.";
  }
  return decoded;
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
  const reasonMessage = loginMessage(params.reason, params.detail, params.status, rateSeconds);

  const legacyRaw =
    params.error && !params.reason ? safeDecodeQuery(params.error) : null;
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
          Magic link authentication powered by Supabase.
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

        <p className="mt-8 text-center text-xs text-zinc-500">
          CoverGrail is not affiliated with CGC or CBCS and does not guarantee
          official grading outcomes.
        </p>
        <p className="mt-4 text-center text-xs text-zinc-600">
          <Link
            href="/api/health/auth-config"
            className="underline decoration-zinc-600 underline-offset-2 hover:text-zinc-400"
          >
            Check Supabase connectivity (deploy diagnostics)
          </Link>
        </p>
      </div>
      <Link
        href="/"
        className="mt-8 text-center text-sm text-zinc-500 hover:text-amber-400"
      >
        ← Back to landing
      </Link>
    </main>
  );
}
