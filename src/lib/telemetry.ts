import type { SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_METADATA_KEYS = new Set([
  "image_count",
  "model",
  "source",
  "status",
]);

export async function recordProductEvent(
  supabase: SupabaseClient,
  userId: string,
  eventName: string,
  scanId: string | null = null,
  metadata: Record<string, string | number | boolean | null> = {},
): Promise<void> {
  const safeMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([key]) => ALLOWED_METADATA_KEYS.has(key)),
  );

  const { error } = await supabase.from("product_events").insert({
    user_id: userId,
    event_name: eventName.slice(0, 80),
    scan_id: scanId,
    metadata: safeMetadata,
  });

  if (error) {
    console.warn("[telemetry] event dropped:", eventName, error.message);
  }
}
