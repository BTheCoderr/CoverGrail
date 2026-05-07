import { comicGradeResultSchema } from "@/lib/ai/comicGradeSchema";

export function getMockComicGrade() {
  return comicGradeResultSchema.parse({
    predicted_grade_low: 8.2,
    predicted_grade_high: 8.8,
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
      "Likely mid-high grade modern candidate based on visible surfaces; interior not verified. Economics vs grading fees look borderline until defects are confirmed under better lighting.",
    estimated_grading_cost: 85,
    estimated_upside: 120,
    next_steps: [
      "Reshoot spine with raking light to confirm tick depth.",
      "Compare predicted range against latest comps for this issue.",
      "If pressing, use a reputable presser familiar with modern heat tolerance.",
    ],
  });
}
