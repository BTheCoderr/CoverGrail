/** Trimmed project URL (https://….supabase.co). */
export function getSupabaseUrl(): string | undefined {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return v || undefined;
}

/**
 * Public API key for browser + server sessions.
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY` may be legacy JWT (`eyJ…`) or new publishable (`sb_publishable_…`).
 * Optional fallback: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` if anon env is empty.
 */
export function getSupabasePublicApiKey(): string | undefined {
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anon) return anon;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishable) return publishable;
  return undefined;
}

/** True only when `NEXT_PUBLIC_SUPABASE_ANON_KEY` is non-empty after trim. */
export function hasSupabaseAnonKeyEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
}

/**
 * Admin client key. `SUPABASE_SERVICE_ROLE_KEY` may be legacy JWT (`eyJ…`) or `sb_secret_…`.
 * Optional fallback env name: `SUPABASE_SECRET_KEY`.
 */
export function getSupabaseServiceRoleKey(): string | undefined {
  const sr = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (sr) return sr;
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (secret) return secret;
  return undefined;
}

export type AnonKeyDiagnosticType = "legacy_jwt" | "publishable" | "unknown" | "missing";

export type ServiceRoleKeyDiagnosticType = "legacy_jwt" | "secret" | "unknown" | "missing";

/** Diagnostics only — keys are never rejected by prefix. */
export function classifyAnonKeyForDiagnostics(key: string | undefined): AnonKeyDiagnosticType {
  const k = key?.trim();
  if (!k) return "missing";
  if (k.startsWith("eyJ")) return "legacy_jwt";
  if (k.startsWith("sb_publishable_")) return "publishable";
  return "unknown";
}

export function classifyServiceRoleForDiagnostics(
  key: string | undefined,
): ServiceRoleKeyDiagnosticType {
  const k = key?.trim();
  if (!k) return "missing";
  if (k.startsWith("eyJ")) return "legacy_jwt";
  if (k.startsWith("sb_secret_")) return "secret";
  return "unknown";
}
