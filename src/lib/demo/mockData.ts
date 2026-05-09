import type { ScanDetailPayload } from "@/app/(app)/scans/[id]/scan-detail-client";

export const DEMO_SCAN_ID = "demo" as const;

/** Dashboard “recent scans” rows (both link to the shared demo result). */
export const DEMO_DASHBOARD_RECENT_SCANS = [
  { id: DEMO_SCAN_ID, title: "Amazing Spider-Man #300", status: "complete" as const },
  { id: DEMO_SCAN_ID, title: "Batman #423", status: "complete" as const },
];

export type DemoCollectionRow = {
  id: string;
  title: string;
  gradeLow: number;
  gradeHigh: number;
  confidenceLabel: string;
  savedAtLabel: string;
};

export const DEMO_COLLECTION_ROWS: DemoCollectionRow[] = [
  {
    id: DEMO_SCAN_ID,
    title: "Amazing Spider-Man #300",
    gradeLow: 8.5,
    gradeHigh: 9.2,
    confidenceLabel: "82%",
    savedAtLabel: "Apr 2, 2026",
  },
  {
    id: DEMO_SCAN_ID,
    title: "Batman #423",
    gradeLow: 8.0,
    gradeHigh: 8.8,
    confidenceLabel: "76%",
    savedAtLabel: "Mar 18, 2026",
  },
  {
    id: DEMO_SCAN_ID,
    title: "X-Men #1",
    gradeLow: 7.5,
    gradeHigh: 8.4,
    confidenceLabel: "71%",
    savedAtLabel: "Feb 9, 2026",
  },
];

export function getDemoScanDetailPayload(): ScanDetailPayload {
  return {
    scan: {
      id: DEMO_SCAN_ID,
      title: "Amazing Spider-Man #300",
      issue_number: "300",
      publisher: "Marvel",
      publication_year: 1988,
      estimated_raw_value: null,
      notes: null,
      status: "complete",
      error_message: null,
      user_saved_at: null,
    },
    images: [],
    result: {
      predicted_grade_low: 8.5,
      predicted_grade_high: 9.2,
      confidence: "high",
      confidencePercent: 82,
      recommendation: "press_first",
      photo_quality_score: 8,
      detected_defects: [
        {
          area: "spine",
          defect: "Spine stress: moderate",
          severity: "moderate",
          grade_impact: "medium",
        },
        {
          area: "corners",
          defect: "Corner blunting: light",
          severity: "minor",
          grade_impact: "low",
        },
        {
          area: "front_cover",
          defect: "Cover wear: light",
          severity: "minor",
          grade_impact: "low",
        },
        {
          area: "centering",
          defect: "Centering: good",
          severity: "minor",
          grade_impact: "low",
        },
        {
          area: "back_cover",
          defect: "Back cover staining: none visible",
          severity: "minor",
          grade_impact: "low",
        },
      ],
      reasoning_summary:
        "Likely worth submitting if pressing improves presentation — spine and corners respond well to conservative pressing.",
      estimated_grading_cost: 50,
      estimated_upside: 175,
      next_steps: [
        "Press first, then consider submission once presentation tightens.",
        "Re-photo under neutral light if any glare masked subtle corner defects.",
      ],
    },
    confirmed_grade: null,
  };
}
