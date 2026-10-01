"use client";

import { createScan } from "@/app/actions/scans";
import { SlabCard } from "@/components/slab-card";
import Link from "next/link";
import { useState, type FormEvent, type HTMLAttributes } from "react";

const MAX_EDGE = 2000;
const TARGET_BYTES = 600_000;
const MAX_CORNERS = 4;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image_decode_failed"));
    };
    image.src = url;
  });
}

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("image_encode_failed"))),
      "image/jpeg",
      quality,
    );
  });
}

async function prepareImage(file: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("unsupported_image");
  }

  const image = await loadImage(file);
  const sourceMax = Math.max(image.naturalWidth, image.naturalHeight);
  let scale = Math.min(1, MAX_EDGE / Math.max(1, sourceMax));
  let quality = 0.86;
  let latest: Blob | null = null;

  for (let pass = 0; pass < 6; pass += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("image_prepare_failed");

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    latest = await canvasToJpeg(canvas, quality);

    if (latest.size <= TARGET_BYTES) break;

    if (quality > 0.68) {
      quality -= 0.08;
    } else {
      scale *= 0.82;
      quality = 0.78;
    }
  }

  if (!latest) throw new Error("image_prepare_failed");

  const baseName = file.name.replace(/\.[^.]+$/, "") || "comic-photo";
  return new File([latest], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

async function prepareNamedFiles(formData: FormData, name: string) {
  const files = formData
    .getAll(name)
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (name === "corners" && files.length > MAX_CORNERS) {
    throw new Error("too_many_corners");
  }

  if (files.length === 0) return;

  formData.delete(name);
  for (const file of files) {
    formData.append(name, await prepareImage(file));
  }
}

async function prepareUpload(formData: FormData) {
  await prepareNamedFiles(formData, "front");
  await prepareNamedFiles(formData, "back");
  await prepareNamedFiles(formData, "spine");
  await prepareNamedFiles(formData, "corners");
}

export function NewScanForm() {
  const [pending, setPending] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setClientError(null);

    const formData = new FormData(event.currentTarget);

    try {
      await prepareUpload(formData);
    } catch (error) {
      const code = error instanceof Error ? error.message : "image_prepare_failed";
      setClientError(
        code === "too_many_corners"
          ? "Choose up to four optional corner close-ups."
          : code === "unsupported_image"
            ? "Use JPEG, PNG, or WebP photos."
            : "One or more photos could not be prepared. Try choosing them again.",
      );
      setPending(false);
      return;
    }

    await createScan(formData);
    setPending(false);
  }

  return (
    <>
      {clientError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {clientError}
        </div>
      ) : null}

      <form
        onSubmit={(event) => void handleSubmit(event)}
        encType="multipart/form-data"
        className="space-y-8"
      >
        <SlabCard label="Photos">
          <div className="grid gap-6">
            <PhotoField
              label="Front cover"
              name="front"
              description="Full bleed front cover, parallel to camera."
              required
            />
            <PhotoField
              label="Back cover"
              name="back"
              description="Include barcode zone if present."
              required
            />
            <PhotoField
              label="Spine close-up"
              name="spine"
              description="Show spine rolls and ticks clearly."
              required
            />
            <label className="block space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Optional corner close-ups
              </span>
              <input
                name="corners"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={pending}
                className="block w-full cursor-pointer rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-6 text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <span className="text-xs text-zinc-400">
                Select up to four JPEG, PNG, or WebP files.
              </span>
            </label>
            <p className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-xs leading-relaxed text-zinc-400">
              CoverGrail resizes photos on your device before upload (up to about
              2000px on the long edge) to make phone uploads faster and more reliable.
            </p>
          </div>
        </SlabCard>

        <SlabCard label="Comic details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" name="title" placeholder="Amazing Spider-Man" disabled={pending} />
            <Field label="Issue number" name="issue_number" placeholder="300" disabled={pending} />
            <Field
              label="Publication year"
              name="publication_year"
              placeholder="1988"
              inputMode="numeric"
              disabled={pending}
            />
            <Field
              label="Estimated raw value (USD)"
              name="estimated_raw_value"
              placeholder="250"
              inputMode="decimal"
              className="sm:col-span-2"
              disabled={pending}
            />
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Notes (optional)
              </span>
              <textarea
                name="notes"
                rows={3}
                disabled={pending}
                placeholder="Restoration history, printing quirks, your hypothesis…"
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none ring-amber-400/0 transition focus:border-amber-500/50 focus:ring-4 focus:ring-amber-400/15 disabled:opacity-60"
              />
            </label>
          </div>
        </SlabCard>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-400">
            CoverGrail is not affiliated with CGC or CBCS and does not guarantee
            official grading outcomes. Predictions are educational pre-submission
            estimates.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-12 min-w-40 items-center justify-center rounded-xl bg-amber-400 px-8 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300"
          >
            {pending ? "Preparing photos…" : "Submit scan"}
          </button>
        </div>
      </form>

      <Link
        href="/dashboard"
        className="inline-flex min-h-11 items-center text-sm text-zinc-400 hover:text-amber-400"
      >
        ← Back to dashboard
      </Link>
    </>
  );
}

function PhotoField({
  label,
  name,
  description,
  required,
}: {
  label: string;
  name: string;
  description: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {label}
        {required ? <span className="text-amber-400"> *</span> : null}
      </span>
      <input
        name={name}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required={required}
        className="block w-full cursor-pointer rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-6 text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <span className="text-xs text-zinc-400">{description}</span>
    </label>
  );
}

function Field({
  label,
  name,
  placeholder,
  inputMode,
  className = "",
  disabled = false,
}: {
  label: string;
  name: string;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
  disabled?: boolean;
}) {
  return (
    <label className={`block space-y-2 ${className}`.trim()}>
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      <input
        name={name}
        placeholder={placeholder}
        inputMode={inputMode}
        disabled={disabled}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none ring-amber-400/0 transition focus:border-amber-500/50 focus:ring-4 focus:ring-amber-400/15 disabled:opacity-60"
      />
    </label>
  );
}
