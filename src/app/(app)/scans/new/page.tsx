import { NewScanForm } from "@/components/scans/NewScanForm";

const ERROR_MESSAGES: Record<string, string> = {
  missing_title: "Add a title before submitting.",
  missing_front: "Front cover photo is required.",
  missing_back: "Back cover photo is required.",
  missing_spine: "Spine photo is required.",
  file_too_large: "One of the images is too large. Try choosing it again.",
  upload_too_large: "The combined upload is too large. Try fewer optional close-ups.",
  unsupported_image: "Use a JPEG, PNG, or WebP image file.",
  too_many_corners: "Upload up to four optional corner close-ups.",
  upload_failed: "Upload failed. Try again.",
  create_failed: "Could not create the scan. Please retry.",
};

export default async function NewScanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error
    ? ERROR_MESSAGES[params.error] ?? "Something went wrong. Please try again."
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

      <NewScanForm />
    </div>
  );
}
