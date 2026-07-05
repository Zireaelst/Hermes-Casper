import { expect, test } from "@playwright/test";

/**
 * End-to-end coverage of the two money paths (demo mode). Mirrors the manual
 * verification: auto-approve settles; over-limit parks for HITL then settles.
 */

test("auto-approve purchase settles with a receipt", async ({ page }) => {
  await page.goto("/marketplace");

  // First listing (7.5 HERMES) is under the 20-HERMES auto-approve limit.
  const card = page.locator("text=Translate up to 1k words").locator("..").locator("..");
  await card.getByRole("button", { name: "Buy now" }).click();

  await expect(page).toHaveURL(/\/orders\//);
  await expect(page.getByText("settled", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Receipt", { exact: false })).toBeVisible();
  // Workflow canvas renders all five stages.
  await expect(page.locator(".react-flow__node")).toHaveCount(5);

  // Capture demo evidence (settled order + workflow canvas + receipt).
  await page.screenshot({ path: "../../docs/product/demo/settled-order.png", fullPage: true });
});

test("over-limit purchase parks for HITL, then settles on approval", async ({ page }) => {
  await page.goto("/marketplace");

  // 45-HERMES listing exceeds the auto-approve limit → parks in Approvals.
  const card = page.locator("text=Summarize a 50-page PDF").locator("..").locator("..");
  await card.getByRole("button", { name: "Buy now" }).click();

  await expect(page.getByText("Waiting for human approval")).toBeVisible();

  await page.goto("/approvals");
  await expect(page.getByText("Summarize a 50-page PDF")).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();

  await expect(page).toHaveURL(/\/orders\//);
  await expect(page.getByText("settled", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Receipt", { exact: false })).toBeVisible();
});
