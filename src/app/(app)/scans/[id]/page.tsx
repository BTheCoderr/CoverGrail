import { createScanSnapshot } from "@/app/(app)/scans/[id]/snapshot";
import {
  ScanDetailClient,
  type ScanDetailPayload,
} from "@/app/(app)/scans/[id]/scan-detail-client";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
