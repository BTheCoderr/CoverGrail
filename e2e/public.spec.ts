import { expect, test } from "@playwright/test";

test("landing page presents the core product", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Know if your comic is worth grading before you pay CGC/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Get 3 Free Pre-Grades/i })).toBeVisible();
  await expect(page).toHaveTitle(/CoverGrail/);
});

test("public product and legal pages render", async ({ page }) => {
  const routes = [
    ["/grading-guide", /Free Comic Grading Guide/i],
    ["/pricing", /Know before you slab it/i],
    ["/privacy", /CoverGrail Privacy Notice/i],
    ["/terms", /CoverGrail Beta Terms/i],
  ] as const;

  for (const [route, heading] of routes) {
    const response = await page.goto(route);
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
  }
});

test("login stays user-facing and hides deploy diagnostics", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Sign in to CoverGrail/i })).toBeVisible();
  await expect(page.getByText(/Check Supabase connectivity/i)).toHaveCount(0);
});

test("non-demo protected route redirects signed-out users", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=(%2F|\/)account/);
});

test("demo scan form still enforces required uploads", async ({ page }) => {
  await page.goto("/scans/new");
  await expect(page.getByRole("heading", { name: /Upload your comic/i })).toBeVisible();

  const requiredFiles = page.locator('input[type="file"][required]');
  expect(await requiredFiles.count()).toBeGreaterThanOrEqual(3);

  const firstValid = await requiredFiles.first().evaluate(
    (input: HTMLInputElement) => input.validity.valid,
  );
  expect(firstValid).toBe(false);
});
