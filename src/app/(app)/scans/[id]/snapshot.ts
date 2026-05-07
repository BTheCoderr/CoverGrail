import { createClient } from "@/lib/supabase/server";
import { sortScanImages } from "@/lib/scans/sort-images";

export async function createScanSnapshot(scanId: string, userId: string) {
  const supabase = await createClient();

  const { data: scan } = await supabase
    .from("comic_scans")
    .select("*")
    .eq("id", scanId)
    .maybeSingle();

  if (!scan || scan.user_id !== userId) {
    return null;
  }

  const { data: imagesRaw } = await supabase
    .from("scan_images")
    .select("*")
    .eq("scan_id", scanId);

  const images = sortScanImages(imagesRaw ?? []);

  const { data: result } = await supabase
    .from("scan_results")
    .select("*")
    .eq("scan_id", scanId)
    .maybeSingle();

  const { data: confirmed_grade } = await supabase
    .from("confirmed_grades")
    .select("*")
    .eq("scan_id", scanId)
    .maybeSingle();

  return {
    scan,
    images,
    result: result ?? null,
    confirmed_grade: confirmed_grade ?? null,
  };
}
