"use client";

import { useState } from "react";

export function FeedbackForm() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setBusy(true); setError(null); setSent(false);
    const payload = {
      category: String(formData.get("category") ?? "other"),
      rating: formData.get("rating") ? Number(formData.get("rating")) : null,
      message: String(formData.get("message") ?? "").trim(),
    };
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(body.error ?? "Could not send feedback");
      return;
    }
    setSent(true);
  }

  return (
    <form action={(fd) => void submit(fd)} className="space-y-4">
      <select name="category" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm">
        <option value="bug">Bug</option>
        <option value="grading">Grading result</option>
        <option value="idea">Idea</option>
        <option value="other">Other</option>
      </select>
      <select name="rating" defaultValue="" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm">
        <option value="">Overall rating (optional)</option>
        {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n}/5</option>)}
      </select>
      <textarea name="message" required minLength={5} maxLength={2000} rows={6}
        placeholder="What happened, what did you expect, or what should we improve?"
        className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm" />
      <button disabled={busy} className="rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50">
        {busy ? "Sending…" : "Send feedback"}
      </button>
      {sent ? <p className="text-sm text-emerald-400">Thanks — feedback received.</p> : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
