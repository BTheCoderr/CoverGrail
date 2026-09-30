"use server";

import { userHasScanQuota } from "@/lib/billing/scanQuota";
import { isDemoMode } from "@/lib/demo/mode";
import { createClient } from "@/lib/supabase/server";
import { recordProductEvent } from "@/lib/telemetry";
import {
  inspectUploadedImage,
  MAX_CORNER_IMAGES,
  MAX_IMAGE_BYTES,
  MAX_TOTAL_UPLOAD_BYTES,
} from "@/lib/uploads/image-validation";
import { redirect } from "next/navigation";

async function assertUnderQuota(userId: string, email: string | undefined) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "free_scans_remaining, paid_scan_credits, subscription_status, monthly_scan_limit, scans_used_this_period",
    )
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").upsert(
      {
        id: userId,
        email: email ?? null,
        full_name: null,
      },
      { onConflict: "id" },
    );
    return { ok: true as const };
  }

  if (!userHasScanQuota(profile)) {
    return { ok: false as const, reason: "quota" as const };
  }

  return { ok: true as const };
}

export async function createScan(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const issue_number =
    String(formData.get("issue_number") ?? "").trim() || null;
  const publisher = String(formData.get("publisher") ?? "").trim() || null;
  const yearRaw = String(formData.get("publication_year") ?? "").trim();
  const publication_year = yearRaw ? parseInt(yearRaw, 10) : null;
  const rawValRaw = String(formData.get("estimated_raw_value") ?? "").trim();
  const estimated_raw_value = rawValRaw
    ? parseFloat(rawValRaw.replace(/,/g, ""))
    : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const front = formData.get("front");
  const back = formData.get("back");
  const spine = formData.get("spine");

  if (!title) {
    redirect("/scans/new?error=missing_title");
  }

  if (!(front instanceof File) || front.size === 0) {
    redirect("/scans/new?error=missing_front");
  }
  if (!(back instanceof File) || back.size === 0) {
    redirect("/scans/new?error=missing_back");
  }
  if (!(spine instanceof File) || spine.size === 0) {
    redirect("/scans/new?error=missing_spine");
  }

  const cornerEntries = formData
    .getAll("corners")
    .filter((f) => f instanceof File && f.size > 0) as File[];

  if (cornerEntries.length > MAX_CORNER_IMAGES) {
    redirect("/scans/new?error=too_many_corners");
  }

  const allFiles = [front, back, spine, ...cornerEntries];
  const totalBytes = allFiles.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
    redirect("/scans/new?error=upload_too_large");
  }

  const inspected = new Map<File, Awaited<ReturnType<typeof inspectUploadedImage>>>();
  for (const file of allFiles) {
    if (file.size > MAX_IMAGE_BYTES) {
      redirect("/scans/new?error=file_too_large");
    }
    const detected = await inspectUploadedImage(file);
    if (!detected) {
      redirect("/scans/new?error=unsupported_image");
    }
    inspected.set(file, detected);
  }

  if (isDemoMode()) {
    redirect("/scans/demo");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  const quota = await assertUnderQuota(userId, user.email ?? undefined);
  if (!quota.ok && quota.reason === "quota") {
    redirect("/pricing?reason=quota");
  }

  const { data: scanRow, error: scanErr } = await supabase
    .from("comic_scans")
    .insert({
      user_id: userId,
      title,
      issue_number,
      publisher,
      publication_year: Number.isFinite(publication_year)
        ? publication_year
        : null,
      estimated_raw_value:
        estimated_raw_value != null && Number.isFinite(estimated_raw_value)
          ? estimated_raw_value
          : null,
      notes,
      status: "pending",
    })
    .select("id")
    .single();

  if (scanErr || !scanRow) {
    redirect(`/scans/new?error=${encodeURIComponent(scanErr?.message ?? "create_failed")}`);
  }

  const scanId = scanRow.id as string;

  async function upload(
    image_type: "front_cover" | "back_cover" | "spine",
    file: File,
  ) {
    const detected = inspected.get(file);
    if (!detected) throw new Error("unsupported_image");
    const path = `${userId}/${scanId}/${image_type}.${detected.ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from("scan-images")
      .upload(path, buf, {
        contentType: detected.mime,
        upsert: false,
      });
    if (error) throw error;
    const { error: insErr } = await supabase.from("scan_images").insert({
      scan_id: scanId,
      user_id: userId,
      image_type,
      storage_path: path,
      sort_order: 0,
    });
    if (insErr) throw insErr;
  }

  try {
    await upload("front_cover", front);
    await upload("back_cover", back);
    await upload("spine", spine);

    let cornerIndex = 0;
    for (const file of cornerEntries) {
      const detected = inspected.get(file);
      if (!detected) throw new Error("unsupported_image");
      const path = `${userId}/${scanId}/corner_${cornerIndex}.${detected.ext}`;
      const buf = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage
        .from("scan-images")
        .upload(path, buf, {
          contentType: detected.mime,
          upsert: false,
        });
      if (error) throw error;
      const { error: insErr } = await supabase.from("scan_images").insert({
        scan_id: scanId,
        user_id: userId,
        image_type: "corner",
        storage_path: path,
        sort_order: cornerIndex,
      });
      if (insErr) throw insErr;
      cornerIndex += 1;
    }
  } catch (e) {
    await supabase
      .from("comic_scans")
      .update({
        status: "failed",
        error_message: e instanceof Error ? e.message : "upload_failed",
      })
      .eq("id", scanId);
    await recordProductEvent(supabase, userId, "scan_upload_failed", scanId, {
      status: "failed",
    });
    redirect("/scans/new?error=upload_failed");
  }

  await recordProductEvent(supabase, userId, "scan_created", scanId, {
    image_count: 3 + cornerEntries.length,
  });

  redirect(`/scans/${scanId}`);
}
