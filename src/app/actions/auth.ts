"use server";

import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  classifyAnonKeyForDiagnostics,
  getSupabasePublicApiKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";
import { getPublicSiteOrigin } from "@/lib/siteOrigin";
import { redirect } from "next/navigation";

function otpErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object" || !("code" in err)) return undefined;
  const c = (err as { code?: unknown }).code;
  return typeof c === "string" && c.length > 0 ? c : undefined;
}

/** Parses "after 54 seconds" / "54 seconds" style copy from Supabase rate-limit responses. */
function parseSecondsFromRateLimitMessage(message: string): number | undefined {
  const after = message.match(/after\s+(\d+)\s*seconds?/i);
  if (after) {
    const n = parseInt(after[1], 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  const plain = message.match(/(\d+)\s*seconds?/i);
  if (plain) {
    const n = parseInt(plain[1], 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  return undefined;
}

function redirectToRateLimit(message?: string) {
  const qs = new URLSearchParams({ reason: "rate_limit" });
  const sec = message ? parseSecondsFromRateLimitMessage(message) : undefined;
  if (sec !== undefined) {
    qs.set("seconds", String(sec));
  }
  redirect(`/login?${qs.toString()}`);
}

function logReturnedAuthError(
  prefix: string,
  err: {
    message?: string;
    name?: string;
    status?: number;
    code?: string;
    cause?: unknown;
  },
) {
  const causeRaw = err.cause;
  let causeStr = "none";
  if (causeRaw !== undefined && causeRaw !== null) {
    if (typeof causeRaw === "object" && "code" in causeRaw) {
      causeStr = String((causeRaw as { code?: unknown }).code ?? JSON.stringify(causeRaw).slice(0, 160));
    } else {
      causeStr = String(causeRaw).slice(0, 160);
    }
  }
  console.error(
    prefix,
    "name=",
    err.name ?? "AuthError",
    "message=",
    (err.message ?? "").replace(/\s+/g, " ").slice(0, 200),
    "status=",
    typeof err.status === "number" ? err.status : "n/a",
    "code=",
    err.code ?? otpErrorCode(err) ?? "n/a",
    "cause=",
    causeStr,
  );
}

function logThrownError(prefix: string, err: unknown) {
  if (err instanceof Error) {
    const causeRaw = err.cause;
    let causeStr = "none";
    if (causeRaw !== undefined && causeRaw !== null) {
      if (typeof causeRaw === "object" && "code" in causeRaw) {
        causeStr = String((causeRaw as { code?: unknown }).code ?? JSON.stringify(causeRaw).slice(0, 160));
      } else {
        causeStr = String(causeRaw).slice(0, 160);
      }
    }
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof (err as { status?: unknown }).status === "number"
        ? (err as { status: number }).status
        : "n/a";
    const code =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      typeof (err as { code?: unknown }).code === "string"
        ? (err as { code: string }).code
        : otpErrorCode(err) ?? "n/a";

    console.error(
      prefix,
      "name=",
      err.name,
      "message=",
      err.message.replace(/\s+/g, " ").slice(0, 200),
      "status=",
      status,
      "code=",
      code,
      "cause=",
      causeStr,
    );
    return;
  }
  console.error(prefix, "non-Error throw:", String(err).slice(0, 200));
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/login?reason=missing_email");
  }

  const url = getSupabaseUrl();
  const apiKey = getSupabasePublicApiKey();

  if (!url || !apiKey) {
    console.error("[auth] missing-env", { hasUrl: Boolean(url), hasPublicKey: Boolean(apiKey) });
    redirect("/login?reason=missing-env");
  }

  try {
    new URL(url);
  } catch {
    console.error("[auth] invalid-supabase-url");
    redirect("/login?reason=invalid-supabase-url");
  }

  const host = new URL(url).hostname;
  const keyType = classifyAnonKeyForDiagnostics(apiKey);

  const siteEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  let redirectOrigin = siteEnv;
  if (!redirectOrigin) {
    redirectOrigin = (await getPublicSiteOrigin()).replace(/\/$/, "");
    console.warn(
      "[auth] NEXT_PUBLIC_SITE_URL unset; using derived origin for emailRedirectTo (set NEXT_PUBLIC_SITE_URL in Production for stable magic links)",
    );
  }

  const emailRedirectTo = `${redirectOrigin}/auth/callback`;

  let redirectHostLog = "unknown";
  try {
    redirectHostLog = new URL(emailRedirectTo).hostname;
  } catch {
    /* malformed NEXT_PUBLIC_SITE_URL — still attempt OTP; Supabase may reject redirect */
  }

  /** OTP initiation: plain `@supabase/supabase-js` client (same URL/key as health probes). Avoids SSR cookie adapter quirks on serverless. */
  const otpClient = createSupabaseJsClient(url, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  console.log(
    `[auth] attempting OTP hasUrl=${Boolean(url)} hasKey=${Boolean(apiKey)} host=${host} keyType=${keyType} redirectHost=${redirectHostLog}`,
  );

  let otpError;
  try {
    ({ error: otpError } = await otpClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
      },
    }));
  } catch (e) {
    logThrownError("[auth] signInWithOtp thrown:", e);
    const code = otpErrorCode(e);
    const msg = e instanceof Error ? e.message : String(e);
    if (code === "over_email_send_rate_limit") {
      redirectToRateLimit(msg);
    }
    const safe = msg.replace(/\s+/g, " ").slice(0, 200);
    redirect(`/login?reason=sign-in-with-otp-failed&detail=${encodeURIComponent(safe)}`);
  }

  if (otpError) {
    logReturnedAuthError("[auth] signInWithOtp returned error:", otpError);
    if (otpError.code === "over_email_send_rate_limit") {
      redirectToRateLimit(otpError.message);
    }
    const safe = otpError.message.replace(/\s+/g, " ").slice(0, 200);
    redirect(`/login?reason=sign-in-with-otp-failed&detail=${encodeURIComponent(safe)}`);
  }

  redirect("/login?sent=1");
}
