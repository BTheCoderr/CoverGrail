/**
 * Temporary QA/demo bypass — sample UI only, no private data.
 * Enable with NEXT_PUBLIC_DEMO_MODE=true at build time.
 */
export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}
