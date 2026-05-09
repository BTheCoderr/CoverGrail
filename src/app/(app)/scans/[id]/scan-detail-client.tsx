"use client";

import { Disclaimer } from "@/components/disclaimer";
import { DefectBreakdown } from "@/components/scans/DefectBreakdown";
import { RecommendationBadge } from "@/components/scans/RecommendationBadge";
import { SlabCard } from "@/components/slab-card";
import type {
  ComicGradeResult,
  DetectedDefectItem,
} from "@/lib/ai/comicGradeSchema";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ComicScan = {
  id: string;
  title: string;
  issue_number?: string | null;
  publisher?: string | null;
  publication_year?: number | null;
  estimated_raw_value?: number | null;
  notes?: string | null;
  status: string;
  error_message?: string | null;
  user_saved_at?: string | null;
};

type ScanResultRow = {
  predicted_grade_low: number;
  predicted_grade_high: number;
  confidence: ComicGradeResult["confidence"];
  /** Demo / display override — shows as a percentage instead of low/med/high label. */
  confidencePercent?: number | null;
  recommendation: ComicGradeResult["recommendation"];
  photo_quality_score: number;
  detected_defects: DetectedDefectItem[];
  reasoning_summary: string;
  estimated_grading_cost: number | null;
  estimated_upside: number | null;
  next_steps: string[];
};

type ConfirmedGradeRow = {
  grading_company: string;
  confirmed_grade: number;
  certification_number: string | null;
  submitted_at: string | null;
  returned_at: string | null;
  notes: string | null;
};

export type ScanDetailPayload = {
  scan: ComicScan;
  images: unknown[];
  result: ScanResultRow | null;
  confirmed_grade: ConfirmedGradeRow | null;
};

function confidenceLabel(c: ComicGradeResult["confidence"]) {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function confidenceDisplayText(result: ScanResultRow | null) {
  if (!result) return "";
  if (typeof result.confidencePercent === "number" && Number.isFinite(result.confidencePercent)) {
    return `${Math.round(result.confidencePercent)}%`;
  }
  return confidenceLabel(result.confidence);
}

export function ScanDetailClient({
  scanId,
  initial,
  demo = false,
}: {
  scanId: string;
  initial: ScanDetailPayload;
  /** Sample-only UI: no grading API, no save, no confirmed-grade POST. */
  demo?: boolean;
}) {
  const [data, setData] = useState(initial);
  const [saveBusy, setSaveBusy] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);
  const [gradeBusy, setGradeBusy] = useState(false);
  const startedGrade = useRef(false);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/scans/${scanId}`);
    if (!res.ok) return;
    const json = (await res.json()) as ScanDetailPayload;
    setData(json);
  }, [scanId]);

  useEffect(() => {
    if (demo) return;
    const waiting =
      (data.scan.status === "pending" || data.scan.status === "grading") &&
      !data.result;
    if (!waiting || startedGrade.current) return;
    startedGrade.current = true;
    void fetch("/api/grade-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanId }),
    }).finally(() => {
      void refresh();
    });
  }, [demo, data.scan.status, data.result, refresh, scanId]);

  useEffect(() => {
    if (demo) return;
    const polling =
      (data.scan.status === "pending" || data.scan.status === "grading") &&
      !data.result;
    if (!polling) return;
    const timer = setInterval(() => void refresh(), 2500);
    return () => clearInterval(timer);
  }, [demo, data.scan.status, data.result, refresh]);

  const defects = useMemo(() => {
    const raw = data.result?.detected_defects;
    if (!Array.isArray(raw)) return [];
    return raw as DetectedDefectItem[];
  }, [data.result]);

  async function handleSave() {
    if (demo) return;
    setSaveBusy(true);
    try {
      await fetch(`/api/scans/${scanId}/save`, { method: "POST" });
      setSavedFlash(true);
      await refresh();
      setTimeout(() => setSavedFlash(false), 2400);
    } finally {
      setSaveBusy(false);
    }
  }

  const processing =
    (data.scan.status === "pending" || data.scan.status === "grading") &&
    !data.result;
  const failed = data.scan.status === "failed";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
            Scan results
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
            {data.scan.title}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            {[
              data.scan.publisher,
              data.scan.issue_number ? `#${data.scan.issue_number}` : null,
              data.scan.publication_year,
            ]
              .filter(Boolean)
              .join(" · ") || "Pre-submission estimate"}
          </p>
          {data.scan.notes ? (
            <p className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 text-sm text-zinc-400">
              <span className="font-semibold text-zinc-500">Your notes: </span>
              {data.scan.notes}
            </p>
          ) : null}
        </div>
        <Link
          href="/collection"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-700 px-4 text-sm text-zinc-200 hover:border-amber-500/40 hover:text-amber-400"
        >
          Back to collection
        </Link>
      </div>

      {processing ? (
        <SlabCard label="Processing">
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
            <p className="text-sm text-zinc-400">
              Running your pre-submission estimate. This can take up to a
              minute.
            </p>
          </div>
        </SlabCard>
      ) : null}

      {failed ? (
        <SlabCard label="Scan failed">
          <p className="text-sm text-red-300">
            {data.scan.error_message ??
              "Something went wrong while analyzing this scan."}
          </p>
          <Link
            href="/scans/new"
            className="mt-6 inline-flex text-sm font-semibold text-amber-400 hover:underline"
          >
            Try a new scan
          </Link>
        </SlabCard>
      ) : null}

      {data.result ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <SlabCard label="Predicted grade range" className="lg:col-span-2">
            <p className="text-xs uppercase tracking-widest text-zinc-500">
              Likely grade range (pre-submission)
            </p>
            <p className="mt-3 text-4xl font-semibold text-zinc-50 sm:text-5xl">
              {Number(data.result.predicted_grade_low).toFixed(1)} –{" "}
              {Number(data.result.predicted_grade_high).toFixed(1)}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-zinc-700 bg-zinc-950/60 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Confidence: {confidenceDisplayText(data.result)}
              </span>
              <RecommendationBadge value={data.result.recommendation} />
            </div>
            {demo ? (
              <p className="mt-4 text-sm text-zinc-400">
                Recommendation: Press first, then consider submission
              </p>
            ) : null}
          </SlabCard>

          <SlabCard label="Photo quality">
            <p className="text-4xl font-semibold text-zinc-50">
              {data.result.photo_quality_score}
              <span className="text-lg font-normal text-zinc-500">/10</span>
            </p>
            <p className="mt-3 text-sm text-zinc-400">
              Based on sharpness, lighting, and coverage of key views.
            </p>
          </SlabCard>

          <SlabCard label="Defect breakdown" className="lg:col-span-3">
            <DefectBreakdown defects={defects} />
          </SlabCard>

          <SlabCard label="Estimated grading cost">
            <p className="text-3xl font-semibold text-zinc-50">
              {data.result.estimated_grading_cost != null
                ? `$${Number(data.result.estimated_grading_cost).toFixed(0)}`
                : "—"}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Illustrative third-party submission fees—not a quote from any
              grading company.
            </p>
          </SlabCard>

          <SlabCard label="Estimated upside">
            <p className="text-3xl font-semibold text-emerald-400/90">
              {data.result.estimated_upside != null
                ? `$${Number(data.result.estimated_upside).toFixed(0)}`
                : "—"}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Illustrative upside vs raw sale after fees—educational only.
            </p>
          </SlabCard>

          <SlabCard label="Reasoning summary" className="lg:col-span-3">
            <p className="text-sm leading-relaxed text-zinc-300">
              {data.result.reasoning_summary}
            </p>
            {demo ? (
              <p className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-950/25 px-4 py-3 text-sm font-medium text-emerald-100/95">
                Decision: likely worth submitting if pressing improves presentation
              </p>
            ) : null}
          </SlabCard>

          <SlabCard label="Next steps" className="lg:col-span-3">
            <ul className="list-inside list-disc space-y-2 text-sm text-zinc-300">
              {(data.result.next_steps ?? []).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </SlabCard>
        </div>
      ) : null}

      {data.result ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveBusy || demo}
            title={
              demo
                ? "Demo mode: sign in and run a real scan to save to your collection."
                : undefined
            }
            className="inline-flex h-11 items-center justify-center rounded-xl bg-amber-400 px-6 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {saveBusy ? "Saving…" : "Save to collection"}
          </button>
          <button
            type="button"
            onClick={() => setGradeOpen(true)}
            disabled={demo}
            title={
              demo
                ? "Demo mode: sign in to record confirmed grades."
                : undefined
            }
            className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-700 px-6 text-sm font-semibold text-zinc-100 hover:border-amber-500/40 hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Update with confirmed CGC/CBCS grade
          </button>
          {savedFlash ? (
            <span className="flex items-center text-sm text-emerald-400">
              Saved to your collection.
            </span>
          ) : null}
          {data.scan.user_saved_at && !savedFlash ? (
            <span className="flex items-center text-sm text-zinc-500">
              Last saved{" "}
              {new Date(data.scan.user_saved_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          ) : null}
        </div>
      ) : null}

      {data.confirmed_grade ? (
        <SlabCard label="Confirmed grade (your records)">
          <p className="text-sm text-zinc-300">
            <span className="font-semibold text-amber-400">
              {data.confirmed_grade.grading_company}
            </span>{" "}
            · {Number(data.confirmed_grade.confirmed_grade).toFixed(1)}
            {data.confirmed_grade.certification_number
              ? ` · Cert #${data.confirmed_grade.certification_number}`
              : null}
          </p>
          {(data.confirmed_grade.submitted_at ||
            data.confirmed_grade.returned_at) && (
            <p className="mt-2 text-xs text-zinc-500">
              {data.confirmed_grade.submitted_at
                ? `Submitted ${data.confirmed_grade.submitted_at}`
                : null}
              {data.confirmed_grade.submitted_at &&
              data.confirmed_grade.returned_at
                ? " · "
                : ""}
              {data.confirmed_grade.returned_at
                ? `Returned ${data.confirmed_grade.returned_at}`
                : null}
            </p>
          )}
          {data.confirmed_grade.notes ? (
            <p className="mt-2 text-sm text-zinc-400">
              {data.confirmed_grade.notes}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-zinc-500">
            For your personal tracking only—not verified by CoverGrail.
          </p>
        </SlabCard>
      ) : null}

      <Disclaimer className="max-w-3xl text-sm text-zinc-500" />

      {gradeOpen ? (
        <ConfirmedGradeDialog
          busy={gradeBusy}
          onClose={() => setGradeOpen(false)}
          onSubmit={async (payload) => {
            setGradeBusy(true);
            try {
              const res = await fetch(`/api/scans/${scanId}/confirmed-grade`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (!res.ok) return;
              setGradeOpen(false);
              await refresh();
            } finally {
              setGradeBusy(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function ConfirmedGradeDialog({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    grading_company: string;
    confirmed_grade: number;
    certification_number: string | null;
    submitted_at: string | null;
    returned_at: string | null;
    notes: string | null;
  }) => Promise<void>;
}) {
  const [company, setCompany] = useState("CGC");
  const [grade, setGrade] = useState("9.8");
  const [cert, setCert] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [returned, setReturned] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 py-10 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-50">
              Confirmed slab grade
            </h2>
            <p className="mt-2 text-xs text-zinc-500">
              Record outcomes after your chosen grading company returns the book.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-400 hover:text-amber-400"
          >
            Close
          </button>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = parseFloat(grade);
            if (!Number.isFinite(parsed)) return;
            void onSubmit({
              grading_company: company.trim(),
              confirmed_grade: parsed,
              certification_number: cert.trim() || null,
              submitted_at: submitted.trim() || null,
              returned_at: returned.trim() || null,
              notes: notes.trim() || null,
            });
          }}
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Grading company
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Grade (0–10)
            <input
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              type="number"
              step="0.1"
              min={0}
              max={10}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Certification # (optional)
            <input
              value={cert}
              onChange={(e) => setCert(e.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Submitted (optional)
            <input
              value={submitted}
              onChange={(e) => setSubmitted(e.target.value)}
              type="date"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Returned (optional)
            <input
              value={returned}
              onChange={(e) => setReturned(e.target.value)}
              type="date"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Notes (optional)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {busy ? "Saving…" : "Save confirmed grade"}
          </button>
        </form>
      </div>
    </div>
  );
}
