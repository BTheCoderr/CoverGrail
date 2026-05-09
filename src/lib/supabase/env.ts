/** Strip wrapping space + accidental spaces/newlines/tabs inside API keys (common Netlify paste bugs). */
export function sanitizeSupabaseApiKey(raw: string | undefined): string | undefined {
  if (raw === undefined || raw === "") return undefined;
  const v = raw.trim().replace(/\s+/g, "");
  return v.length > 0 ? v : undefined;
}

/** Trim, strip trailing slashes only — never mutate hostname/path oddly. */
export function getSupabaseUrl(): string | undefined {
  let v = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!v) return undefined;
  v = v.replace(/\/+$/, "");
  return v || undefined;
}

/**
 * Public API key for browser + server sessions.
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` may be legacy JWT (`eyJ…`) or new publishable (`sb_publishable_…`).
 * Optional fallback: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` if anon env is empty.
 */
export function getSupabasePublicApiKey(): string | undefined {
  const anon = sanitizeSupabaseApiKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (anon) return anon;
  return sanitizeSupabaseApiKey(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/** True when `NEXT_PUBLIC_SUPABASE_ANON_KEY` is non-empty after sanitization. */
export function hasSupabaseAnonKeyEnv(): boolean {
  return Boolean(sanitizeSupabaseApiKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
}

/**
 * Admin client key. `SUPABASE_SERVICE_ROLE_KEY` may be legacy JWT (`eyJ…`) or `sb_secret_…`.
 * Optional fallback env name: `SUPABASE_SECRET_KEY`.
 */
export function getSupabaseServiceRoleKey(): string | undefined {
  const sr = sanitizeSupabaseApiKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (sr) return sr;
  return sanitizeSupabaseApiKey(process.env.SUPABASE_SECRET_KEY);
}

export type AnonKeyDiagnosticType = "legacy_jwt" | "publishable" | "unknown" | "missing";

export type ServiceRoleKeyDiagnosticType = "legacy_jwt" | "secret" | "unknown" | "missing";

/** Diagnostics only — keys are never rejected by prefix. */
export function classifyAnonKeyForDiagnostics(key: string | undefined): AnonKeyDiagnosticType {
  const k = sanitizeSupabaseApiKey(typeof key === "string" ? key : undefined);
  if (!k) return "missing";
  if (k.startsWith("eyJ")) return "legacy_jwt";
  if (k.startsWith("sb_publishable_")) return "publishable";
  return "unknown";
}

export function classifyServiceRoleForDiagnostics(
  key: string | undefined,
): ServiceRoleKeyDiagnosticType {
  const k = sanitizeSupabaseApiKey(typeof key === "string" ? key : undefined);
  if (!k) return "missing";
  if (k.startsWith("eyJ")) return "legacy_jwt";
  if (k.startsWith("sb_secret_")) return "secret";
  return "unknown";
}
