"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicApiKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getPublicSiteOrigin } from "@/lib/siteOrigin";
import { redirect } from "next/navigation";

function otpErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object" || !("code" in err)) return undefined;
  const c = (err as { code?: unknown }).code;
  return typeof c === "string" && c.length > 0 ? c : undefined;
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

  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auth] createClient:", msg);
    redirect("/login?reason=missing-env");
  }

  const origin = await getPublicSiteOrigin();

  let otpError;
  try {
    ({ error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin.replace(/\/$/, "")}/auth/callback`,
      },
    }));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const safe = msg.replace(/\s+/g, " ").slice(0, 200);
    const code = otpErrorCode(e);
    console.error("[auth] signInWithOtp failed:", safe, "code=", code ?? "n/a");
    redirect(`/login?reason=sign-in-with-otp-failed&detail=${encodeURIComponent(safe)}`);
  }

  if (otpError) {
    const safe = otpError.message.replace(/\s+/g, " ").slice(0, 200);
    const code = otpErrorCode(otpError);
    console.error("[auth] signInWithOtp failed:", safe, "code=", code ?? "n/a");
    redirect(`/login?reason=sign-in-with-otp-failed&detail=${encodeURIComponent(safe)}`);
  }

  redirect("/login?sent=1");
}
