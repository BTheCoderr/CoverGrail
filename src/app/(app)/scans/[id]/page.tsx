import {
  ScanDetailClient,
  type ScanDetailPayload,
} from "@/app/(app)/scans/[id]/scan-detail-client";
import { DEMO_SCAN_ID, getDemoScanDetailPayload } from "@/lib/demo/mockData";
import { isDemoMode } from "@/lib/demo/mode";
import { createScanSnapshot } from "@/app/(app)/scans/[id]/snapshot";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (isDemoMode() && id === DEMO_SCAN_ID) {
    return (
      <ScanDetailClient
        scanId={DEMO_SCAN_ID}
        initial={getDemoScanDetailPayload()}
        demo
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const initial = await createScanSnapshot(id, user.id);

  if (!initial) {
    notFound();
  }

  return (
    <ScanDetailClient scanId={id} initial={initial as ScanDetailPayload} />
  );
}
