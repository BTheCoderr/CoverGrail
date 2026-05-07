import { createClient } from "@/lib/supabase/server";
import { sortScanImages } from "@/lib/scans/sort-images";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: scan, error } = await supabase
    .from("comic_scans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !scan || scan.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: imagesRaw } = await supabase
    .from("scan_images")
    .select("*")
    .eq("scan_id", id);

  const images = sortScanImages(imagesRaw ?? []);

  const { data: result } = await supabase
    .from("scan_results")
    .select("*")
    .eq("scan_id", id)
    .maybeSingle();

  const { data: confirmed_grade } = await supabase
    .from("confirmed_grades")
    .select("*")
    .eq("scan_id", id)
    .maybeSingle();

  return NextResponse.json({
    scan,
    images,
    result: result ?? null,
    confirmed_grade: confirmed_grade ?? null,
  });
}
