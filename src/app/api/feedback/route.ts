import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const CATEGORIES = new Set(["bug", "idea", "grading", "other"]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as
    | { category?: unknown; rating?: unknown; message?: unknown }
    | null;

  const category = typeof body?.category === "string" ? body.category : "other";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const rating = typeof body?.rating === "number" ? body.rating : null;

  if (!CATEGORIES.has(category)) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  if (message.length < 5 || message.length > 2000) return NextResponse.json({ error: "Feedback must be 5–2000 characters." }, { status: 400 });
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });
  }

  const { error } = await supabase.from("beta_feedback").insert({
    user_id: user.id, category, rating, message,
  });
  if (error) return NextResponse.json({ error: "Could not save feedback" }, { status: 500 });

  await supabase.from("product_events").insert({
    user_id: user.id,
    event_name: "feedback_submitted",
    metadata: { category, rating },
  });

  return NextResponse.json({ ok: true });
}
