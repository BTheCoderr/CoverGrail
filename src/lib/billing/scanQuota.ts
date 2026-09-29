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

/** Monthly subscription scans (spec): only `active` status qualifies for included monthly scans. */
export function subscriptionAllowsMonthlyQuotaConsumption(
  status: string | null | undefined,
): boolean {
  return status === "active";
}

export function userHasScanQuota(p: ScanQuotaProfile): boolean {
  if ((p.free_scans_remaining ?? 0) > 0) return true;
  if ((p.paid_scan_credits ?? 0) > 0) return true;
  const limit = p.monthly_scan_limit ?? 0;
  const used = p.scans_used_this_period ?? 0;
  if (
    subscriptionAllowsMonthlyQuotaConsumption(p.subscription_status) &&
    limit > 0 &&
    used < limit
  ) {
    return true;
  }
  return false;
}

/**
 * Atomically consumes quota for one completed scan.
 *
 * The database RPC is idempotent per scan and owns the billing-field mutation,
 * so browser clients never need UPDATE privileges on plan/credit columns.
 */
export async function consumeScanAfterGrade(
  supabase: SupabaseClient,
  scanId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("consume_scan_quota", {
    p_scan_id: scanId,
  });

  if (error) {
    throw new Error(`Could not record scan quota: ${error.message}`);
  }

  if (data !== true) {
    throw new Error("Could not record scan quota");
  }
}
