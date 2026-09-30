import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/login", "/grading-guide", "/pricing", "/privacy", "/terms"];

for (const route of routes) {
  test(`accessibility: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      results.violations
        .map((violation) => `${violation.id}: ${violation.help}`)
        .join("\n"),
    ).toEqual([]);
  });
}
