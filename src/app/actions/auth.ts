"use server";

import { createClient } from "@/lib/supabase/server";
import { getPublicSiteOrigin } from "@/lib/siteOrigin";
import { redirect } from "next/navigation";

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("fetch failed") ||
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("econnrefused") ||
    m.includes("enotfound")
  ) {
    return (
      "Could not reach Supabase from this deployment. In Netlify, set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY for Production (and Preview if you use it), then redeploy. " +
      "Confirm the Supabase project is active."
    );
  }
  return message;
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect("/login?error=missing_email");
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auth-login] createClient:", msg);
    redirect(`/login?error=${encodeURIComponent("Supabase client misconfigured (missing URL or anon key on the server).")}`);
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
    console.error("[auth-login] signInWithOtp threw:", msg);
    redirect(`/login?error=${encodeURIComponent(friendlyAuthError(msg))}`);
  }

  if (otpError) {
    console.error("[auth-login] signInWithOtp:", otpError.message);
    redirect(`/login?error=${encodeURIComponent(friendlyAuthError(otpError.message))}`);
  }

  redirect("/login?check_email=1");
}
