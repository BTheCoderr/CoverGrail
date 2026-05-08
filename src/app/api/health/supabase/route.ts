import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Deploy diagnostics: same runtime path as login Server Actions.
 * Does not expose secrets — only booleans, public hostname, and reachability.
 */
export async function GET() {
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  let supabaseHost: string | null = null;
  let urlParseError = false;
  if (urlRaw) {
    try {
      supabaseHost = new URL(urlRaw).hostname;
    } catch {
      urlParseError = true;
      supabaseHost = null;
    }
  }

  const configured = Boolean(urlRaw && anon && !urlParseError);

  let authReachable: boolean | null = null;
  let authCheckDetail: string | null = null;

  if (configured && urlRaw && anon) {
    const healthUrl = `${urlRaw.replace(/\/$/, "")}/auth/v1/health`;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(healthUrl, {
        method: "GET",
        signal: ctrl.signal,
        headers: {
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
      });
      clearTimeout(timer);
      authReachable = res.ok;
      if (!res.ok) authCheckDetail = `HTTP ${res.status}`;
    } catch (e) {
      authReachable = false;
      authCheckDetail =
        e instanceof Error ? e.name === "AbortError" ? "timeout" : e.message : "unknown";
    }
  }

  let hint: string;
  if (!urlRaw || !anon) {
    hint =
      "Netlify is missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for this deploy context (Production). Add them under Site → Environment variables, then redeploy.";
  } else if (urlParseError) {
    hint = "NEXT_PUBLIC_SUPABASE_URL is not a valid URL.";
  } else if (authReachable === false) {
    hint =
      "This server cannot reach Supabase Auth (same failure mode as magic-link login). Confirm the project is not paused, keys match Settings → API, check Supabase status page, then redeploy Netlify.";
  } else {
    hint =
      "Reachability from Netlify looks OK. If emails never arrive: Authentication → Providers → Email enabled; check spam; SMTP/custom SMTP limits.";
  }

  return NextResponse.json({
    ok: authReachable === true,
    configured,
    supabaseHost,
    anonKeyPresent: Boolean(anon),
    anonKeyLooksLikeJwt: anon?.startsWith("eyJ") ?? false,
    authReachable,
    authCheckDetail,
    hint,
  });
}
