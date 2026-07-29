import { expect, test } from "@playwright/test";
import { activePopover, selectAntOption, zhText } from "./helpers/ant";
import { openWorkspace, tableRow } from "./helpers/workspace";

test.describe("工作台配置、术语和协作", () => {
  test.beforeEach(async ({ page }) => {
    await openWorkspace(page);
  });

  test("可以新增语种并在词条表格增加目标列", async ({ page }) => {
    await page.getByRole("tab", { name: "语种配置" }).click();
    const panel = page.getByRole("tabpanel", { name: "语种配置" });
    await panel.getByPlaceholder("例如 ko-KR").fill("ko-KR");
    await panel.getByPlaceholder("例如 한국어").fill("한국어");
    await panel.getByRole("button", { name: "新增语种" }).click();

    await expect(panel.getByText("ko-KR", { exact: true })).toBeVisible();
    await expect(panel.getByText("한국어", { exact: true })).toBeVisible();

    await page.getByRole("tab", { name: "词条工作台" }).click();
    await expect(page.getByText("한국어 · ko-KR")).toBeVisible();
  });

  test("禁用目标语种后词条表格不再显示该语种列", async ({ page }) => {
    await page.getByRole("tab", { name: "语种配置" }).click();
    const japaneseRow = tableRow(page, "日本語");
    await japaneseRow.locator(".ant-switch").click();

    await page.getByRole("tab", { name: "词条工作台" }).click();
    await expect(page.getByText("日本語 · ja-JP")).toHaveCount(0);
    await expect(page.getByText("English · en-US")).toBeVisible();
  });

  test("@smoke 可以新增术语并删除", async ({ page }) => {
    await page.getByRole("tab", { name: "术语库" }).click();
    const panel = page.getByRole("tabpanel", { name: "术语库" });
    await panel.getByPlaceholder("源术语").fill("自动化术语");
    await panel.getByPlaceholder("当前语种译法").fill("automation term");
    await panel.getByPlaceholder("说明").fill("Playwright 新增术语");
    await panel.getByRole("button", { name: "新增术语" }).click();

    await expect(panel.getByText("自动化术语")).toBeVisible();
    await expect(panel.getByText("automation term")).toBeVisible();

    const termRow = tableRow(page, "自动化术语");
    await termRow.getByRole("button", { name: zhText("删除") }).click();
    const confirm = activePopover(page, "删除该术语？");
    await expect(confirm).toBeVisible();
    await confirm.getByRole("button", { name: zhText("删除") }).click();
    await expect(page.getByText("自动化术语")).toHaveCount(0);
  });

  test("可以新增禁用术语", async ({ page }) => {
    await page.getByRole("tab", { name: "术语库" }).click();
    const panel = page.getByRole("tabpanel", { name: "术语库" });
    await panel.getByPlaceholder("源术语").fill("夸张营销");
    await panel.getByPlaceholder("当前语种译法").fill("hype");
    await selectAntOption(page, ".type-select", "禁用术语");
    await panel.getByPlaceholder("说明").fill("禁用表达自动化覆盖");
    await panel.getByRole("button", { name: "新增术语" }).click();

    await expect(tableRow(page, "夸张营销").getByText("禁用", { exact: true })).toBeVisible();
    await expect(panel.getByText("hype")).toBeVisible();
  });

  test("可以邀请成员并显示在成员列表中", async ({ page }) => {
    await page.getByRole("tab", { name: "成员与审计" }).click();
    const panel = page.getByRole("tabpanel", { name: "成员与审计" });
    await panel.getByPlaceholder("姓名").fill("QA Tester");
    await panel.getByPlaceholder("name@company.com").fill("qa.tester@dictly.local");
    await panel.getByRole("button", { name: "邀请成员" }).click();

    const memberTable = panel.getByRole("table").first();
    await expect(memberTable.getByText("QA Tester")).toBeVisible();
    await expect(memberTable.getByText("qa.tester@dictly.local")).toBeVisible();
  });

  test("审计活动会记录词条保存操作", async ({ page }) => {
    await page.getByRole("button", { name: /新增词条/ }).click();
    const drawer = page.locator(".ant-drawer-content-wrapper", { hasText: "词条编辑" }).last();
    await drawer.locator(".ant-form-item", { hasText: "唯一 Key" }).locator("input").fill("qa.audit.entry");
    await drawer
      .locator(".ant-form-item", { hasText: "源语言文案" })
      .locator("textarea")
      .fill("审计活动源文案");
    await drawer.getByRole("button", { name: zhText("保存") }).click();

    await page.getByRole("tab", { name: "成员与审计" }).click();
    const panel = page.getByRole("tabpanel", { name: "成员与审计" });
    await expect(panel.getByText("保存词条")).toBeVisible();
    await expect(panel.getByText("qa.audit.entry")).toBeVisible();
  });
});
