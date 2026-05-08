import { headers } from "next/headers";

/**
 * Canonical site URL for redirects (magic links, Stripe callbacks).
 * Prefer NEXT_PUBLIC_SITE_URL; on Netlify fall back to the incoming Host when unset/mis-set.
 */
export async function getPublicSiteOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (env) return env;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;

  return "http://localhost:3000";
}
