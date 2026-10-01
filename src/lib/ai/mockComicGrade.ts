import { comicGradeResultSchema } from "@/lib/ai/comicGradeSchema";

export function getMockComicGrade() {
  return comicGradeResultSchema.parse({
    predicted_grade_low: 8.0,
    predicted_grade_high: 8.5,
    confidence: "medium",
    recommendation: "maybe",
    photo_quality_score: 7,
    detected_defects: [
      {
        area: "spine",
        defect: "Light spine ticks visible under raking light",
        severity: "minor",
        grade_impact: "medium",
      },
      {
        area: "corners",
        defect: "Minor blunting bottom leading corner",
        severity: "minor",
        grade_impact: "low",
      },
    ],
    reasoning_summary:
      "Illustrative mid-grade example based on fictional visible-surface observations; interior condition is not represented.",
    estimated_grading_cost: null,
    estimated_upside: null,
    next_steps: [
      "Reshoot spine with raking light to confirm tick depth.",
      "Compare predicted range against latest comps for this issue.",
      "If pressing, use a reputable presser familiar with modern heat tolerance.",
    ],
  });
}
