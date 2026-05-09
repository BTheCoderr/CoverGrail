"use server";

import { createClient } from "@/lib/supabase/server";
import { probeSupabaseAuthHealth } from "@/lib/supabase/authHealthProbe";
import { getSupabasePublicApiKey, getSupabaseUrl } from "@/lib/supabase/env";
import { getPublicSiteOrigin } from "@/lib/siteOrigin";
import { redirect } from "next/navigation";

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

  const probe = await probeSupabaseAuthHealth(url, apiKey);
  if (!probe.ok) {
    if (probe.status !== undefined) {
      console.error("[auth] auth-health-non-200", probe.status);
      redirect(`/login?reason=auth-health-non-200&status=${encodeURIComponent(String(probe.status))}`);
    }
    console.error("[auth] auth-health-fetch-failed", probe.error);
    redirect(
      `/login?reason=auth-health-fetch-failed&detail=${encodeURIComponent(probe.error ?? "unknown")}`,
    );
  }
  console.log("[auth] auth health ok status=", probe.status);

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
    console.error("[auth] signInWithOtp failed:", safe);
    redirect(`/login?reason=sign-in-with-otp-failed&detail=${encodeURIComponent(safe)}`);
  }

  if (otpError) {
    const safe = otpError.message.replace(/\s+/g, " ").slice(0, 200);
    const status =
      typeof otpError === "object" &&
      otpError !== null &&
      "status" in otpError &&
      typeof (otpError as { status?: unknown }).status === "number"
        ? (otpError as { status: number }).status
        : "";
    console.error("[auth] signInWithOtp failed:", status, safe);
    redirect(`/login?reason=sign-in-with-otp-failed&detail=${encodeURIComponent(safe)}`);
  }

  redirect("/login?check_email=1");
}
