import {
  classifyAnonKeyForDiagnostics,
  classifyServiceRoleForDiagnostics,
  getSupabasePublicApiKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  hasSupabaseAnonKeyEnv,
} from "@/lib/supabase/env";
import { probeSupabaseAuthHealth } from "@/lib/supabase/authHealthProbe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const urlRaw = getSupabaseUrl();
    const keyEffective = getSupabasePublicApiKey();
    const serviceRole = getSupabaseServiceRoleKey();

    let supabaseUrlHost: string | null = null;
    if (urlRaw) {
      try {
        supabaseUrlHost = new URL(urlRaw).hostname;
      } catch {
        supabaseUrlHost = null;
      }
    }

    const anonKeyType = classifyAnonKeyForDiagnostics(keyEffective);
    const serviceRoleKeyType = classifyServiceRoleForDiagnostics(serviceRole);

    const env: {
      hasSupabaseUrl: boolean;
      hasSupabaseAnonKey: boolean;
      hasServiceRoleKey: boolean;
      supabaseUrlHost: string | null;
      anonKeyType: typeof anonKeyType;
      serviceRoleKeyType: typeof serviceRoleKeyType;
      anonKeyPrefix6?: string;
    } = {
      hasSupabaseUrl: Boolean(urlRaw),
      hasSupabaseAnonKey: hasSupabaseAnonKeyEnv(),
      hasServiceRoleKey: Boolean(serviceRole),
      supabaseUrlHost,
      anonKeyType,
      serviceRoleKeyType,
    };

    if (keyEffective) {
      env.anonKeyPrefix6 = keyEffective.slice(0, 6);
    }

    let authHealthProbe: {
      ok: boolean;
      status?: number;
      error?: string;
    };

    if (!urlRaw || !keyEffective || !supabaseUrlHost) {
      authHealthProbe = {
        ok: false,
        error: "fetch-failed",
      };
    } else {
      const probe = await probeSupabaseAuthHealth(urlRaw, keyEffective);
      if (probe.ok) {
        authHealthProbe = { ok: true, status: probe.status };
      } else if (probe.status !== undefined) {
        authHealthProbe = {
          ok: false,
          status: probe.status,
          error: "non-200",
        };
      } else {
        authHealthProbe = {
          ok: false,
          error: "fetch-failed",
        };
      }
    }

    const ok =
      env.hasSupabaseUrl &&
      Boolean(urlRaw && keyEffective && supabaseUrlHost) &&
      authHealthProbe.ok;

    console.log(
      `[auth-config] hasUrl=${env.hasSupabaseUrl} hasAnon=${env.hasSupabaseAnonKey} anonType=${anonKeyType} serviceType=${serviceRoleKeyType} host=${supabaseUrlHost ?? "none"}`,
    );
    if (authHealthProbe.ok) {
      console.log(`[auth-config] health status=${authHealthProbe.status}`);
    } else {
      console.log(
        `[auth-config] health failed status=${authHealthProbe.status ?? "n/a"} error=${authHealthProbe.error ?? "unknown"}`,
      );
    }

    return NextResponse.json({
      ok,
      env,
      authHealthProbe,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[auth-config] handler error:", msg);
    return NextResponse.json(
      {
        ok: false,
        env: {
          hasSupabaseUrl: false,
          hasSupabaseAnonKey: false,
          hasServiceRoleKey: false,
          supabaseUrlHost: null,
          anonKeyType: "missing" as const,
          serviceRoleKeyType: "missing" as const,
        },
        authHealthProbe: {
          ok: false,
          error: "fetch-failed",
        },
      },
      { status: 200 },
    );
  }
}
