import { gradeComicPhotos } from "@/lib/ai/gradeComic";
import { createClient } from "@/lib/supabase/server";
import { sortScanImages } from "@/lib/scans/sort-images";
import { NextResponse } from "next/server";

export const maxDuration = 60;

type Body = { scanId?: string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const scanId = body.scanId;
  if (!scanId || typeof scanId !== "string") {
    return NextResponse.json({ error: "scanId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: scan, error: scanError } = await supabase
    .from("comic_scans")
    .select("*")
    .eq("id", scanId)
    .maybeSingle();

  if (scanError || !scan || scan.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("scan_results")
    .select("id")
    .eq("scan_id", scanId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("comic_scans")
      .update({ status: "complete", error_message: null })
      .eq("id", scanId);
    return NextResponse.json({ ok: true, cached: true });
  }

  await supabase
    .from("comic_scans")
    .update({ status: "grading", error_message: null })
    .eq("id", scanId);

  const { data: imagesRaw, error: imgErr } = await supabase
    .from("scan_images")
    .select("*")
    .eq("scan_id", scanId);

  const images = sortScanImages(imagesRaw ?? []);

  if (imgErr || !images.length) {
    await supabase
      .from("comic_scans")
      .update({
        status: "failed",
        error_message: "No images for scan",
      })
      .eq("id", scanId);
    return NextResponse.json({ error: "No images for scan" }, { status: 400 });
  }

  const signedUrls: string[] = [];
  for (const row of images) {
    const path = row.storage_path as string;
    const { data: signed, error: signErr } = await supabase.storage
      .from("scan-images")
      .createSignedUrl(path, 60 * 30);

    if (signErr || !signed?.signedUrl) {
      await supabase
        .from("comic_scans")
        .update({
          status: "failed",
          error_message: signErr?.message ?? "sign_failed",
        })
        .eq("id", scanId);
      return NextResponse.json(
        { error: "Could not sign image URLs" },
        { status: 500 },
      );
    }
    signedUrls.push(signed.signedUrl);
  }

  try {
    const { data, modelId } = await gradeComicPhotos({
      imageUrls: signedUrls,
      metadata: {
        title: scan.title as string,
        issue_number: scan.issue_number as string | null,
        publisher: scan.publisher as string | null,
        publication_year: scan.publication_year as number | null,
        estimated_raw_value: scan.estimated_raw_value as number | null,
        notes: scan.notes as string | null,
      },
    });

    const { error: insErr } = await supabase.from("scan_results").insert({
      scan_id: scanId,
      predicted_grade_low: data.predicted_grade_low,
      predicted_grade_high: data.predicted_grade_high,
      confidence: data.confidence,
      recommendation: data.recommendation,
      photo_quality_score: data.photo_quality_score,
      detected_defects: data.detected_defects,
      reasoning_summary: data.reasoning_summary,
      estimated_grading_cost: data.estimated_grading_cost,
      estimated_upside: data.estimated_upside,
      next_steps: data.next_steps,
      raw_ai_response: { model: modelId },
    });

    if (insErr) {
      await supabase
        .from("comic_scans")
        .update({
          status: "failed",
          error_message: insErr.message,
        })
        .eq("id", scanId);
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    await supabase
      .from("comic_scans")
      .update({ status: "complete", error_message: null })
      .eq("id", scanId);

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, free_scans_remaining")
      .eq("id", user.id)
      .maybeSingle();

    if (
      profile &&
      profile.plan === "free" &&
      typeof profile.free_scans_remaining === "number" &&
      profile.free_scans_remaining > 0
    ) {
      await supabase
        .from("profiles")
        .update({
          free_scans_remaining: profile.free_scans_remaining - 1,
        })
        .eq("id", user.id);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "grade_failed";
    await supabase
      .from("comic_scans")
      .update({
        status: "failed",
        error_message: message,
      })
      .eq("id", scanId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
