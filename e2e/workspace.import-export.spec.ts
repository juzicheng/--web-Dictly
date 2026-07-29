import { expect, test } from "@playwright/test";
import { selectAntOption } from "./helpers/ant";
import { openWorkspace } from "./helpers/workspace";

test.describe("导入导出流程", () => {
  test.beforeEach(async ({ page }) => {
    await openWorkspace(page);
  });

  test("@smoke 工具栏导入导出按钮会打开导入导出标签页", async ({ page }) => {
    await page.locator(".toolbar-panel").getByRole("button", { name: /导入导出/ }).click();

    await expect(page.getByRole("tab", { name: "导入导出" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByText("导入任务")).toBeVisible();
    await expect(page.getByText("导出目标")).toBeVisible();
  });

  test("可以导入 JSON 词条文件", async ({ page }) => {
    await page.getByRole("tab", { name: "导入导出" }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "dictly-playwright-import.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          qa: {
            imported: {
              title: "Imported by Playwright",
            },
          },
        }),
      ),
    });

    await expect(page.getByText("dictly-playwright-import.json")).toBeVisible();
    await page.getByRole("button", { name: "开始导入" }).click();

    await expect(page.getByText("已导入 1 条")).toBeVisible();
    await page.getByRole("tab", { name: "词条工作台" }).click();
    await page.getByPlaceholder("搜索 key、译文、备注、标签").fill("qa.imported.title");
    await page.getByPlaceholder("搜索 key、译文、备注、标签").press("Enter");
    await expect(page.getByText("qa.imported.title")).toBeVisible();
  });

  test("可以触发默认 JSON 导出下载", async ({ page }) => {
    await page.getByRole("tab", { name: "导入导出" }).click();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /导出文件/ }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/dictly-commerce-en-US\.json/i);
  });

  test("可以切换导出格式并下载 YAML", async ({ page }) => {
    await page.getByRole("tab", { name: "导入导出" }).click();
    const exportCard = page.locator(".dense-card", { hasText: "导出目标" });
    await selectAntOption(page, exportCard.locator(".format-select").first(), "YAML");

    const downloadPromise = page.waitForEvent("download");
    await exportCard.getByRole("button", { name: /导出文件/ }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/dictly-commerce-en-US\.yaml/i);
  });
});
