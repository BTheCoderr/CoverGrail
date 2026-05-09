import Link from "next/link";
import type { Metadata } from "next";
import { loginAction } from "@/app/actions/auth";

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

function loginMessage(reason?: string, detail?: string, status?: string): string | null {
  switch (reason) {
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
  }>;
}) {
  const params = await searchParams;

  const reasonMessage = loginMessage(params.reason, params.detail, params.status);
  const legacyError =
    params.error && !params.reason ? decodeURIComponent(params.error) : null;
  const alertText = reasonMessage ?? legacyError;

  const showSentBanner = Boolean(params.sent) || Boolean(params.check_email);

  const isDiagnosticSoft =
    params.reason === "auth-health-fetch-failed" ||
    params.reason === "auth-health-non-200" ||
    params.reason === "fetch-failed";

  const alertBoxClass = isDiagnosticSoft
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

        {showSentBanner ? (
          <p className="mt-6 rounded-xl border border-amber-500/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            Check your email for the sign-in link. You can close this tab once
            it arrives.
          </p>
        ) : null}

        {alertText ? (
          <p className={`mt-6 rounded-xl ${alertBoxClass}`}>{alertText}</p>
        ) : null}

        <form action={loginAction} className="mt-8 space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Email
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none ring-amber-400/0 transition focus:border-amber-500/50 focus:ring-4 focus:ring-amber-400/15"
            />
          </label>
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            Email me a login link
          </button>
        </form>

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
