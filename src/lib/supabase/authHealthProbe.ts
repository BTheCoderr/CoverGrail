import { classifyAnonKeyForDiagnostics } from "@/lib/supabase/env";

export type ConnectivityProbeResult = {
  /** HTTP response received (no transport-layer failure). */
  ok: boolean;
  status?: number;
  error?: string;
  errorName?: string;
  errorMessage?: string;
  errorCauseCode?: string;
  targetUrlHost: string;
  targetPath: string;
  keyType: string;
};

export type SupabaseConnectivityProbes = {
  authHealthNoAuth: ConnectivityProbeResult;
  authHealthWithKey: ConnectivityProbeResult;
  restWithKey: ConnectivityProbeResult;
};

export type AuthHealthProbeResult =
  | { ok: true; status: number }
  | { ok: false; status?: number; error: string };

function extractCauseCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  if (!("cause" in err)) return undefined;
  const cause = (err as { cause?: unknown }).cause;
  if (cause && typeof cause === "object" && "code" in cause) {
    const code = (cause as { code?: unknown }).code;
    if (code !== undefined && code !== null) return String(code);
  }
  return undefined;
}

async function fetchConnectivityProbe(
  supabaseUrl: string,
  path: string,
  headers: Record<string, string>,
  keyType: string,
): Promise<ConnectivityProbeResult> {
  let parsed: URL;
  try {
    parsed = new URL(supabaseUrl);
  } catch {
    return {
      ok: false,
      targetUrlHost: "invalid",
      targetPath: path,
      keyType,
      error: "invalid-url",
      errorName: "InvalidURL",
      errorMessage: "NEXT_PUBLIC_SUPABASE_URL could not be parsed",
    };
  }

  const targetUrlHost = parsed.hostname;
  const targetUrl = `${parsed.origin}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(targetUrl, {
      method: "GET",
      signal: ctrl.signal,
      headers,
    });
    clearTimeout(timer);
    return {
      ok: true,
      status: res.status,
      targetUrlHost,
      targetPath: path,
      keyType,
    };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const causeCode = extractCauseCode(err);
    const msg = err.message.replace(/\s+/g, " ").slice(0, 200);
    console.error(
      `[auth-health] fetch failed name=${err.name} message=${msg} cause=${causeCode ?? "none"}`,
    );
    return {
      ok: false,
      targetUrlHost,
      targetPath: path,
      keyType,
      error: "fetch-failed",
      errorName: err.name,
      errorMessage: msg,
      ...(causeCode ? { errorCauseCode: causeCode } : {}),
    };
  }
}

function skippedProbe(path: string, reason: string, keyType: string): ConnectivityProbeResult {
  return {
    ok: false,
    targetUrlHost: "unset",
    targetPath: path,
    keyType,
    error: "skipped",
    errorMessage: reason,
    errorName: "Skipped",
  };
}

/** Runs three connectivity checks for diagnostics (auth-config route). */
export async function runSupabaseConnectivityProbes(
  supabaseUrl: string | undefined,
  publicKey: string | undefined,
): Promise<SupabaseConnectivityProbes> {
  if (!supabaseUrl?.trim() || !publicKey?.trim()) {
    return {
      authHealthNoAuth: skippedProbe("/auth/v1/health", "missing-url-or-key", "none"),
      authHealthWithKey: skippedProbe("/auth/v1/health", "missing-url-or-key", "unknown"),
      restWithKey: skippedProbe("/rest/v1/", "missing-url-or-key", "unknown"),
    };
  }

  const keyDiag = classifyAnonKeyForDiagnostics(publicKey);
  const keyTypeLabel = keyDiag === "missing" ? "unknown" : keyDiag;

  const authHealthNoAuth = await fetchConnectivityProbe(
    supabaseUrl,
    "/auth/v1/health",
    {},
    "none",
  );

  const authHealthWithKey = await fetchConnectivityProbe(
    supabaseUrl,
    "/auth/v1/health",
    {
      apikey: publicKey,
      Authorization: `Bearer ${publicKey}`,
    },
    keyTypeLabel,
  );

  const restWithKey = await fetchConnectivityProbe(
    supabaseUrl,
    "/rest/v1/",
    {
      apikey: publicKey,
      Authorization: `Bearer ${publicKey}`,
    },
    keyTypeLabel,
  );

  return { authHealthNoAuth, authHealthWithKey, restWithKey };
}

/** Login gate: keyed Auth health must return HTTP 2xx (same as magic-link client). */
export async function probeSupabaseAuthHealth(
  supabaseUrl: string,
  apiKey: string,
): Promise<AuthHealthProbeResult> {
  const kt = classifyAnonKeyForDiagnostics(apiKey);
  const keyTypeLabel = kt === "missing" ? "unknown" : kt;

  const r = await fetchConnectivityProbe(
    supabaseUrl,
    "/auth/v1/health",
    {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
    },
    keyTypeLabel,
  );

  if (!r.ok) {
    return {
      ok: false,
      error: r.errorMessage ?? r.error ?? "fetch-failed",
    };
  }

  if (r.status !== undefined && r.status >= 400) {
    return { ok: false, status: r.status, error: `HTTP_${r.status}` };
  }

  return { ok: true, status: r.status ?? 0 };
}
