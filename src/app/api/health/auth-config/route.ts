import {
  classifyAnonKeyForDiagnostics,
  classifyServiceRoleForDiagnostics,
  getSupabasePublicApiKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  hasSupabaseAnonKeyEnv,
} from "@/lib/supabase/env";
import {
  type ConnectivityProbeResult,
  runSupabaseConnectivityProbes,
} from "@/lib/supabase/authHealthProbe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Safe fields only — never keys; expands probe failures for operators. */
function probeFailureSnapshot(p: ConnectivityProbeResult) {
  return {
    ok: p.ok,
    ...(p.status !== undefined ? { status: p.status } : {}),
    targetUrlHost: p.targetUrlHost,
    targetPath: p.targetPath,
    keyType: p.keyType,
    ...(p.error ? { error: p.error } : {}),
    ...(p.errorName ? { errorName: p.errorName } : {}),
    ...(p.errorMessage ? { errorMessage: p.errorMessage } : {}),
    ...(p.errorCauseCode ? { errorCauseCode: p.errorCauseCode } : {}),
  };
}

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

    const probes = await runSupabaseConnectivityProbes(urlRaw, keyEffective);

    const keyedAuthHealthy =
      probes.authHealthWithKey.ok &&
      probes.authHealthWithKey.status !== undefined &&
      probes.authHealthWithKey.status >= 200 &&
      probes.authHealthWithKey.status < 400;

    const ok =
      Boolean(urlRaw && keyEffective && supabaseUrlHost) && keyedAuthHealthy;

    console.log(
      `[auth-config] hasUrl=${env.hasSupabaseUrl} hasAnon=${env.hasSupabaseAnonKey} anonType=${anonKeyType} serviceType=${serviceRoleKeyType} host=${supabaseUrlHost ?? "none"}`,
    );
    console.log(
      `[auth-config] probes noAuth=${probes.authHealthNoAuth.ok}:${probes.authHealthNoAuth.status ?? "na"} keyed=${probes.authHealthWithKey.ok}:${probes.authHealthWithKey.status ?? "na"} rest=${probes.restWithKey.ok}:${probes.restWithKey.status ?? "na"}`,
    );
    if (keyedAuthHealthy) {
      console.log(`[auth-config] auth health (keyed) status=${probes.authHealthWithKey.status}`);
    }

    return NextResponse.json({
      ok,
      env,
      probes,
      ...(!ok
        ? {
            failureDetails: {
              authHealthNoAuth: probeFailureSnapshot(probes.authHealthNoAuth),
              authHealthWithKey: probeFailureSnapshot(probes.authHealthWithKey),
              restWithKey: probeFailureSnapshot(probes.restWithKey),
            },
          }
        : {}),
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const msg = err.message.slice(0, 200);
    const causeCode =
      err.cause &&
      typeof err.cause === "object" &&
      "code" in err.cause &&
      (err.cause as { code?: unknown }).code !== undefined &&
      (err.cause as { code?: unknown }).code !== null
        ? String((err.cause as { code: unknown }).code)
        : undefined;
    console.error("[auth-config] handler error:", msg);
    const fallbackProbe = {
      ok: false as const,
      targetUrlHost: "unknown" as const,
      targetPath: "" as const,
      keyType: "none" as const,
      error: "fetch-failed" as const,
      errorName: err.name,
      errorMessage: msg,
      ...(causeCode ? { errorCauseCode: causeCode } : {}),
    };
    const authProbeCatch = {
      ...fallbackProbe,
      targetPath: "/auth/v1/health",
    };
    const restProbeCatch = {
      ...fallbackProbe,
      targetPath: "/rest/v1/",
      keyType: "unknown",
    };
    const keyedCatch = { ...fallbackProbe, targetPath: "/auth/v1/health", keyType: "unknown" };

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
        probes: {
          authHealthNoAuth: authProbeCatch,
          authHealthWithKey: keyedCatch,
          restWithKey: restProbeCatch,
        },
        failureDetails: {
          authHealthNoAuth: probeFailureSnapshot(authProbeCatch),
          authHealthWithKey: probeFailureSnapshot(keyedCatch),
          restWithKey: probeFailureSnapshot(restProbeCatch),
        },
      },
      { status: 200 },
    );
  }
}
