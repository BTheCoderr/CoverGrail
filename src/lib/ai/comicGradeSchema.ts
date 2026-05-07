import { z } from "zod";

/** Matches product JSON schema — plus estimated_upside for the results UI. */
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
    predicted_grade_low: z.number().min(0).max(10),
    predicted_grade_high: z.number().min(0).max(10),
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
    estimated_grading_cost: z.number().min(0),
    estimated_upside: z.number().nullable(),
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
    predicted_grade_low: { type: "number" },
    predicted_grade_high: { type: "number" },
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
    estimated_grading_cost: { type: "number" },
    estimated_upside: {
      anyOf: [{ type: "number" }, { type: "null" }],
    },
    next_steps: {
      type: "array",
      items: { type: "string" },
    },
  },
} as const;
