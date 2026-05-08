import type { SupabaseClient } from "@supabase/supabase-js";

export type ScanQuotaProfile = {
  free_scans_remaining?: number | null;
  paid_scan_credits?: number | null;
  subscription_status?: string | null;
  monthly_scan_limit?: number | null;
  scans_used_this_period?: number | null;
};

export function subscriptionIsActiveForScans(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export function userHasScanQuota(p: ScanQuotaProfile): boolean {
  if ((p.free_scans_remaining ?? 0) > 0) return true;
  if ((p.paid_scan_credits ?? 0) > 0) return true;
  const limit = p.monthly_scan_limit ?? 0;
  const used = p.scans_used_this_period ?? 0;
  if (subscriptionIsActiveForScans(p.subscription_status) && limit > 0 && used < limit) {
    return true;
  }
  return false;
}

/**
 * After a successful scan_results insert: prefer free tier, then paid credits, then subscription usage.
 */
export async function consumeScanAfterGrade(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: p } = await supabase
    .from("profiles")
    .select(
      "free_scans_remaining, paid_scan_credits, subscription_status, monthly_scan_limit, scans_used_this_period",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!p) return;

  const free = p.free_scans_remaining ?? 0;
  if (free > 0) {
    await supabase
      .from("profiles")
      .update({ free_scans_remaining: free - 1 })
      .eq("id", userId);
    return;
  }

  const credits = p.paid_scan_credits ?? 0;
  if (credits > 0) {
    await supabase.from("profiles").update({ paid_scan_credits: credits - 1 }).eq("id", userId);
    return;
  }

  if (
    subscriptionIsActiveForScans(p.subscription_status as string | null) &&
    (p.monthly_scan_limit ?? 0) > 0
  ) {
    await supabase
      .from("profiles")
      .update({ scans_used_this_period: (p.scans_used_this_period ?? 0) + 1 })
      .eq("id", userId);
  }
}
