import { gradeComicPhotos } from "@/lib/ai/gradeComic";
import {
  consumeScanAfterGrade,
  userHasScanQuota,
} from "@/lib/billing/scanQuota";
import { createClient } from "@/lib/supabase/server";
import { recordProductEvent } from "@/lib/telemetry";
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

    try {
      await consumeScanAfterGrade(supabase, scanId);
    } catch (error) {
      console.error(
        "[grade-scan] Cached result exists but quota reconciliation failed:",
        error instanceof Error ? error.message : "quota_reconciliation_failed",
      );
      return NextResponse.json(
        { error: "Could not finalize scan quota" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, cached: true });
  }

  const { data: quotaProfile } = await supabase
    .from("profiles")
    .select(
      "free_scans_remaining, paid_scan_credits, subscription_status, monthly_scan_limit, scans_used_this_period",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!userHasScanQuota(quotaProfile ?? {})) {
    return NextResponse.json(
      { error: "Scan quota exceeded. Upgrade or buy credits on Pricing." },
      { status: 402 },
    );
  }

  const { data: lockedScan, error: lockError } = await supabase
    .from("comic_scans")
    .update({ status: "grading", error_message: null })
    .eq("id", scanId)
    .in("status", ["pending", "failed"])
    .select("id")
    .maybeSingle();

  if (lockError) {
    console.error("[grade-scan] Could not acquire grading lock:", lockError.message);
    return NextResponse.json({ error: "Could not start grading" }, { status: 500 });
  }

  if (!lockedScan) {
    return NextResponse.json(
      { error: "This scan is already being graded." },
      { status: 409 },
    );
  }

  const { data: activeGrades, error: activeGradesError } = await supabase
    .from("comic_scans")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("status", "grading")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (activeGradesError) {
    await supabase
      .from("comic_scans")
      .update({ status: "failed", error_message: "grading_guard_failed" })
      .eq("id", scanId);
    return NextResponse.json(
      { error: "Could not verify grading capacity" },
      { status: 500 },
    );
  }

  const winner = activeGrades?.[0]?.id;
  if (winner && winner !== scanId) {
    await supabase
      .from("comic_scans")
      .update({ status: "pending", error_message: null })
      .eq("id", scanId);

    return NextResponse.json(
      { error: "Another scan is already being graded. Try again shortly." },
      { status: 429 },
    );
  }

  await recordProductEvent(supabase, user.id, "grade_started", scanId, {
    status: "grading",
  });

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

    await consumeScanAfterGrade(supabase, scanId);
    await recordProductEvent(supabase, user.id, "grade_completed", scanId, {
      model: modelId,
      status: "complete",
    });

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
    await recordProductEvent(supabase, user.id, "grade_failed", scanId, {
      status: "failed",
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
