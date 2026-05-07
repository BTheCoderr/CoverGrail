import { createScan } from "@/app/actions/scans";
import { SlabCard } from "@/components/slab-card";
import Link from "next/link";
import type { HTMLAttributes } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  missing_title: "Add a title before submitting.",
  missing_front: "Front cover photo is required.",
  missing_back: "Back cover photo is required.",
  missing_spine: "Spine photo is required.",
  file_too_large: "Each image must be under 12MB.",
  upload_failed: "Upload failed. Try again with smaller images.",
  create_failed: "Could not create scan. Please retry.",
};

export default async function NewScanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error =
    params.error && ERROR_MESSAGES[params.error]
      ? ERROR_MESSAGES[params.error]
      : params.error
        ? decodeURIComponent(params.error)
        : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
          New scan
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50">
          Upload your comic
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          Capture neutral lighting, fill the frame, and include spine texture.
          Corners are optional but help tighten the predicted grade range.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <form
        action={createScan}
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
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Optional corner close-ups
              </span>
              <input
                name="corners"
                type="file"
                accept="image/*"
                multiple
                className="block w-full cursor-pointer rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-6 text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-400 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-950"
              />
              <span className="text-xs text-zinc-500">
                Select multiple files in one go if needed.
              </span>
            </label>
          </div>
        </SlabCard>

        <SlabCard label="Comic details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" name="title" placeholder="Amazing Spider-Man" />
            <Field label="Issue number" name="issue_number" placeholder="300" />
            <Field
              label="Publication year"
              name="publication_year"
              placeholder="1988"
              inputMode="numeric"
            />
            <Field
              label="Estimated raw value (USD)"
              name="estimated_raw_value"
              placeholder="250"
              inputMode="decimal"
              className="sm:col-span-2"
            />
            <label className="block space-y-2 sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Notes (optional)
              </span>
              <textarea
                name="notes"
                rows={3}
                placeholder="Restoration history, printing quirks, your hypothesis…"
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none ring-amber-400/0 transition focus:border-amber-500/50 focus:ring-4 focus:ring-amber-400/15"
              />
            </label>
          </div>
        </SlabCard>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            CoverGrail is not affiliated with CGC or CBCS and does not guarantee
            official grading outcomes. Predictions are educational pre-submission
            estimates.
          </p>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-amber-400 px-8 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
          >
            Submit scan
          </button>
        </div>
      </form>

      <Link
        href="/dashboard"
        className="inline-flex text-sm text-zinc-500 hover:text-amber-400"
      >
        ← Back to dashboard
      </Link>
    </div>
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
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
        {required ? (
          <span className="text-amber-400"> *</span>
        ) : null}
      </span>
      <input
        name={name}
        type="file"
        accept="image/*"
        required={required}
        className="block w-full cursor-pointer rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 px-4 py-6 text-sm text-zinc-300 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-50"
      />
      <span className="text-xs text-zinc-500">{description}</span>
    </label>
  );
}

function Field({
  label,
  name,
  placeholder,
  inputMode,
  className = "",
}: {
  label: string;
  name: string;
  placeholder?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  className?: string;
}) {
  return (
    <label className={`block space-y-2 ${className}`.trim()}>
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <input
        name={name}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none ring-amber-400/0 transition focus:border-amber-500/50 focus:ring-4 focus:ring-amber-400/15"
      />
    </label>
  );
}
