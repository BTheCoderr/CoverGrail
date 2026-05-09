export type AuthHealthProbeResult =
  | { ok: true; status: number }
  | { ok: false; status?: number; error: string };

/** GET `${supabaseUrl}/auth/v1/health` with anon/publishable key headers (same as GoTrue clients). */
export async function probeSupabaseAuthHealth(
  supabaseUrl: string,
  apiKey: string,
): Promise<AuthHealthProbeResult> {
  let parsed: URL;
  try {
    parsed = new URL(supabaseUrl);
  } catch {
    return { ok: false, error: "invalid-url" };
  }

  const healthUrl = `${parsed.origin}/auth/v1/health`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(healthUrl, {
      method: "GET",
      signal: ctrl.signal,
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP_${res.status}` };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    const msg = e instanceof Error ? e.message : "unknown";
    if (name === "AbortError") {
      return { ok: false, error: "timeout" };
    }
    const safe = msg.replace(/\s+/g, " ").slice(0, 160);
    return { ok: false, error: safe };
  }
}
