import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type Body = {
  grading_company?: string;
  confirmed_grade?: number;
  certification_number?: string | null;
  submitted_at?: string | null;
  returned_at?: string | null;
  notes?: string | null;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const grading_company = body.grading_company?.trim();
  const confirmed_grade = body.confirmed_grade;

  if (!grading_company) {
    return NextResponse.json({ error: "grading_company required" }, { status: 400 });
  }
  if (typeof confirmed_grade !== "number" || confirmed_grade < 0 || confirmed_grade > 10) {
    return NextResponse.json({ error: "Invalid confirmed_grade" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: scan } = await supabase
    .from("comic_scans")
    .select("id,user_id")
    .eq("id", id)
    .maybeSingle();

  if (!scan || scan.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase.from("confirmed_grades").upsert(
    {
      scan_id: id,
      grading_company,
      confirmed_grade,
      certification_number: body.certification_number ?? null,
      submitted_at: body.submitted_at ?? null,
      returned_at: body.returned_at ?? null,
      notes: body.notes ?? null,
    },
    { onConflict: "scan_id" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
