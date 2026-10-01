import test from "node:test";
import assert from "node:assert/strict";

import {
  subscriptionAllowsMonthlyQuotaConsumption,
  userHasScanQuota,
} from "../src/lib/billing/scanQuota.ts";
import { isMockGradeEnabled } from "../src/lib/ai/mode.ts";
import { comicGradeResultSchema } from "../src/lib/ai/comicGradeSchema.ts";
import { detectImageType } from "../src/lib/uploads/image-validation.ts";
import { sortScanImages } from "../src/lib/scans/sort-images.ts";

test("free or paid credits satisfy quota", () => {
  assert.equal(userHasScanQuota({ free_scans_remaining: 1 }), true);
  assert.equal(userHasScanQuota({ paid_scan_credits: 1 }), true);
});

test("monthly quota requires active subscription and room", () => {
  assert.equal(
    userHasScanQuota({
      subscription_status: "active",
      monthly_scan_limit: 25,
      scans_used_this_period: 24,
    }),
    true,
  );
  assert.equal(
    userHasScanQuota({
      subscription_status: "past_due",
      monthly_scan_limit: 25,
      scans_used_this_period: 0,
    }),
    false,
  );
  assert.equal(subscriptionAllowsMonthlyQuotaConsumption("trialing"), false);
});

test("scan images sort front, back, spine, then corners", () => {
  const rows = [
    { image_type: "corner", sort_order: 2 },
    { image_type: "spine", sort_order: 0 },
    { image_type: "front_cover", sort_order: 0 },
    { image_type: "corner", sort_order: 0 },
    { image_type: "back_cover", sort_order: 0 },
  ];
  assert.deepEqual(
    sortScanImages(rows).map((row) => [row.image_type, row.sort_order]),
    [
      ["front_cover", 0],
      ["back_cover", 0],
      ["spine", 0],
      ["corner", 0],
      ["corner", 2],
    ],
  );
});

test("image signatures detect JPEG, PNG and WebP", () => {
  assert.deepEqual(
    detectImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0x00])),
    { mime: "image/jpeg", ext: "jpg" },
  );
  assert.deepEqual(
    detectImageType(Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])),
    { mime: "image/png", ext: "png" },
  );
  assert.deepEqual(
    detectImageType(Uint8Array.from([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50])),
    { mime: "image/webp", ext: "webp" },
  );
  assert.equal(detectImageType(Uint8Array.from([1,2,3,4,5])), null);
});


test("mock grading flag recognizes supported truthy values", () => {
  const previous = process.env.MOCK_GRADE;
  try {
    process.env.MOCK_GRADE = "true";
    assert.equal(isMockGradeEnabled(), true);
    process.env.MOCK_GRADE = "1";
    assert.equal(isMockGradeEnabled(), true);
    process.env.MOCK_GRADE = "false";
    assert.equal(isMockGradeEnabled(), false);
  } finally {
    if (previous === undefined) delete process.env.MOCK_GRADE;
    else process.env.MOCK_GRADE = previous;
  }
});


test("live grading schema only accepts standard grade points and null economics", () => {
  const base = {
    confidence: "medium",
    recommendation: "maybe",
    photo_quality_score: 8,
    detected_defects: [],
    reasoning_summary: "Test",
    estimated_grading_cost: null,
    estimated_upside: null,
    next_steps: [],
  };

  assert.equal(
    comicGradeResultSchema.safeParse({
      ...base,
      predicted_grade_low: 9.4,
      predicted_grade_high: 9.8,
    }).success,
    true,
  );

  assert.equal(
    comicGradeResultSchema.safeParse({
      ...base,
      predicted_grade_low: 9.3,
      predicted_grade_high: 9.8,
    }).success,
    false,
  );

  assert.equal(
    comicGradeResultSchema.safeParse({
      ...base,
      predicted_grade_low: 9.4,
      predicted_grade_high: 9.8,
      estimated_grading_cost: 85,
    }).success,
    false,
  );
});
