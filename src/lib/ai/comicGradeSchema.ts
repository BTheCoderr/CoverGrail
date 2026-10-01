import { z } from "zod";

export const OFFICIAL_COMIC_GRADE_POINTS = [
  0.5, 1.0, 1.5, 1.8, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0,
  6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 9.2, 9.4, 9.6, 9.8, 9.9, 10.0,
] as const;

const comicGradePointSchema = z
  .number()
  .refine(
    (value) => (OFFICIAL_COMIC_GRADE_POINTS as readonly number[]).includes(value),
    "grade must use a standard comic grading scale point",
  );

/** Matches product JSON schema — economics stay null until backed by real fee/comps data. */
export const defectAreaSchema = z.enum([
  "front_cover",
  "back_cover",
  "spine",
  "corners",
  "edges",
  "centering",
  "unknown",
]);

export const defectSeveritySchema = z.enum([
  "minor",
  "moderate",
  "major",
  "severe",
]);

export const gradeImpactSchema = z.enum(["low", "medium", "high"]);

export const detectedDefectItemSchema = z.object({
  area: defectAreaSchema,
  defect: z.string(),
  severity: defectSeveritySchema,
  grade_impact: gradeImpactSchema,
});

export const comicGradeResultSchema = z
  .object({
    predicted_grade_low: comicGradePointSchema,
    predicted_grade_high: comicGradePointSchema,
    confidence: z.enum(["low", "medium", "high"]),
    recommendation: z.enum([
      "submit",
      "press_first",
      "maybe",
      "sell_raw",
      "rescan_photos",
    ]),
    photo_quality_score: z.number().int().min(1).max(10),
    detected_defects: z.array(detectedDefectItemSchema),
    reasoning_summary: z.string(),
    estimated_grading_cost: z.null(),
    estimated_upside: z.null(),
    next_steps: z.array(z.string()),
  })
  .strict()
  .refine((d) => d.predicted_grade_low <= d.predicted_grade_high, {
    message: "predicted_grade_low must be <= predicted_grade_high",
  });

export type ComicGradeResult = z.infer<typeof comicGradeResultSchema>;
export type DetectedDefectItem = z.infer<typeof detectedDefectItemSchema>;

/** JSON Schema subset for OpenAI structured outputs (optional future use). */
export const comicGradeJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "predicted_grade_low",
    "predicted_grade_high",
    "confidence",
    "recommendation",
    "photo_quality_score",
    "detected_defects",
    "reasoning_summary",
    "estimated_grading_cost",
    "estimated_upside",
    "next_steps",
  ],
  properties: {
    predicted_grade_low: { type: "number", enum: [...OFFICIAL_COMIC_GRADE_POINTS] },
    predicted_grade_high: { type: "number", enum: [...OFFICIAL_COMIC_GRADE_POINTS] },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
    },
    recommendation: {
      type: "string",
      enum: ["submit", "press_first", "maybe", "sell_raw", "rescan_photos"],
    },
    photo_quality_score: {
      type: "integer",
      minimum: 1,
      maximum: 10,
    },
    detected_defects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["area", "defect", "severity", "grade_impact"],
        properties: {
          area: {
            type: "string",
            enum: [
              "front_cover",
              "back_cover",
              "spine",
              "corners",
              "edges",
              "centering",
              "unknown",
            ],
          },
          defect: { type: "string" },
          severity: {
            type: "string",
            enum: ["minor", "moderate", "major", "severe"],
          },
          grade_impact: {
            type: "string",
            enum: ["low", "medium", "high"],
          },
        },
      },
    },
    reasoning_summary: { type: "string" },
    estimated_grading_cost: { type: "null" },
    estimated_upside: { type: "null" },
    next_steps: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;
