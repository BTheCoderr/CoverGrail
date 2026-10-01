import { expect, test } from "@playwright/test";

test("landing page presents the core product", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Know if your comic is worth grading before you pay CGC/i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Explore the validation beta/i }),
  ).toBeVisible();
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

  await page.goto("/login?reason=sign-in-with-otp-failed&detail=AUDIT_TEST_SHOULD_NOT_RENDER");
  await expect(page.getByText(/AUDIT_TEST_SHOULD_NOT_RENDER/i)).toHaveCount(0);
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


test("production responses include baseline security headers", async ({ page }) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["permissions-policy"]).toContain("camera=()");
  expect(response?.headers()["permissions-policy"]).toContain("microphone=()");
  expect(response?.headers()["permissions-policy"]).toContain("geolocation=()");
});

test("production auth health endpoint exposes status only", async ({ request }) => {
  const response = await request.get("/api/health/auth-config");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(Object.keys(body).sort()).toEqual(["ok"]);
  expect(typeof body.ok).toBe("boolean");
});

test("core public pages do not overflow the viewport", async ({ page }) => {
  for (const route of ["/", "/login", "/pricing", "/grading-guide"]) {
    await page.goto(route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow, `horizontal overflow on ${route}`).toBe(false);
  }
});


test("mock grading mode keeps paid checkout disabled", async ({ request }) => {
  const response = await request.post("/api/create-checkout-session", {
    data: { plan: "single_scan" },
  });
  expect(response.status()).toBe(503);
  const body = await response.json();
  expect(body.error).toMatch(/paused/i);
});

test("landing labels the example grade as sample output", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/SAMPLE RESULT/i)).toBeVisible();
});
