import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { SlabCard } from "@/components/slab-card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Beta feedback</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-50">Help improve CoverGrail</h1>
        <p className="mt-3 text-sm text-zinc-400">Do not include private or sensitive information.</p>
      </div>
      <SlabCard label="Feedback"><FeedbackForm /></SlabCard>
    </div>
  );
}
