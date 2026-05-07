import OpenAI from "openai";
import {
  type ComicGradeResult,
  comicGradeResultSchema,
} from "@/lib/ai/comicGradeSchema";
import { getMockComicGrade } from "@/lib/ai/mockComicGrade";

const SYSTEM_PROMPT = `You are CoverGrail, an AI pre-grading assistant for comic book collectors.

Your job is not to replace CGC, CBCS, or any professional grading company. Your job is to analyze user-submitted photos and estimate a likely grade range for pre-submission decision-making.

Analyze the uploaded comic images:
- front cover
- back cover
- spine close-up
- optional corners

Evaluate visible condition markers:
- spine stress
- color-breaking ticks
- corner blunting
- edge wear
- creases
- staining
- foxing
- writing
- tears
- missing pieces
- cover gloss issues
- staple condition if visible
- centering/wrap
- back cover damage
- photo quality limitations

Return a conservative predicted grade range, not a single exact grade.

Rules:
- Never claim this is an official grade.
- Never claim affiliation with CGC or CBCS.
- If photos are blurry, dark, overexposed, cropped, or missing key views, lower confidence and recommend rescan_photos.
- If the grade range is low and submission economics look weak, recommend sell_raw.
- If the comic presents well but visible pressable defects exist, recommend press_first.
- If the predicted grade range is strong and confidence is high, recommend submit.
- Be especially careful with high-grade predictions above 9.2. Small defects matter heavily at that level.

Include estimated_upside as nullable number (USD): illustrative net upside vs selling raw after typical grading fees and the user-provided raw value when possible; use null if not inferable.

Return only valid JSON matching this shape (no markdown):
{
  "predicted_grade_low": number,
  "predicted_grade_high": number,
  "confidence": "low"|"medium"|"high",
  "recommendation": "submit"|"press_first"|"maybe"|"sell_raw"|"rescan_photos",
  "photo_quality_score": integer 1-10,
  "detected_defects": [{"area":"front_cover"|"back_cover"|"spine"|"corners"|"edges"|"centering"|"unknown","defect":string,"severity":"minor"|"moderate"|"major"|"severe","grade_impact":"low"|"medium"|"high"}],
  "reasoning_summary": string,
  "estimated_grading_cost": number,
  "estimated_upside": number|null,
  "next_steps": string[]
}`;

export async function gradeComicPhotos(params: {
  imageUrls: string[];
  metadata: {
    title: string;
    issue_number?: string | null;
    publisher?: string | null;
    publication_year?: number | null;
    estimated_raw_value?: number | null;
    notes?: string | null;
  };
  model?: string;
}): Promise<{ data: ComicGradeResult; modelId: string }> {
  if (
    process.env.MOCK_GRADE === "1" ||
    process.env.MOCK_GRADE === "true"
  ) {
    return { data: getMockComicGrade(), modelId: "mock" };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured (set MOCK_GRADE=true for demos)",
    );
  }

  const client = new OpenAI({ apiKey });
  const model = params.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const metaLines = [
    `Title: ${params.metadata.title}`,
    params.metadata.issue_number
      ? `Issue: ${params.metadata.issue_number}`
      : null,
    params.metadata.publisher
      ? `Publisher: ${params.metadata.publisher}`
      : null,
    params.metadata.publication_year != null
      ? `Publication year: ${params.metadata.publication_year}`
      : null,
    params.metadata.estimated_raw_value != null
      ? `Estimated raw value (USD, user): ${params.metadata.estimated_raw_value}`
      : null,
    params.metadata.notes ? `Collector notes: ${params.metadata.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const content: OpenAI.Chat.ChatCompletionContentPart[] = [
    {
      type: "text",
      text: `Analyze these comic photos.\n${metaLines}`,
    },
    ...params.imageUrls.map((url) => ({
      type: "image_url" as const,
      image_url: { url, detail: "high" as const },
    })),
  ];

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.15,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty model response");

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new Error("Model returned non-JSON content");
  }

  const parsed = comicGradeResultSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`Invalid model JSON: ${parsed.error.message}`);
  }

  return { data: parsed.data, modelId: model };
}
