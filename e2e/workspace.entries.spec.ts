import { expect, test } from "@playwright/test";
import { activeModal, entryDrawer, fillFormItem, selectAntOption, zhText } from "./helpers/ant";
import { clickRowAction, openWorkspace, selectTableRow, tableRow } from "./helpers/workspace";

test.describe("翻译工作台词条流程", () => {
  test.beforeEach(async ({ page }) => {
    await openWorkspace(page);
  });

  test("@smoke 显示工作台结构、标签页和首屏词条", async ({ page }) => {
    await expect(page.getByText("增长产品团队", { exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "词条工作台" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "语种配置" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "导入导出" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "术语库" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "成员与审计" })).toBeVisible();
    await expect(page.getByText("auth.login.title")).toBeVisible();
    await expect(page.getByText("order.list.empty")).toBeVisible();
  });

  test("可以按 key 搜索词条并重置筛选", async ({ page }) => {
    await page.getByPlaceholder("搜索 key、译文、备注、标签").fill("payment.modal.timeout");
    await page.getByPlaceholder("搜索 key、译文、备注、标签").press("Enter");

    await expect(page.getByText("payment.modal.timeout")).toBeVisible();
    await expect(page.getByText("auth.login.title")).toHaveCount(0);

    await page.getByRole("button", { name: zhText("重置") }).click();
    await expect(page.getByText("auth.login.title")).toBeVisible();
  });

  test("可以只查看未翻译词条", async ({ page }) => {
    await page.getByRole("checkbox", { name: "未翻译" }).check();

    await expect(page.getByText("order.list.empty")).toBeVisible();
    await expect(page.getByText("payment.modal.timeout")).toBeVisible();
    await expect(page.getByText("auth.login.title")).toHaveCount(0);
  });

  test("可以新增词条并在表格中看到结果", async ({ page }) => {
    await page.getByRole("button", { name: /新增词条/ }).click();

    const drawer = entryDrawer(page);
    await expect(drawer).toBeVisible();
    await fillFormItem(drawer, "唯一 Key", "qa.created.title");
    await fillFormItem(drawer, "分组", "qa.created");
    await fillFormItem(drawer, "源语言文案", "Playwright 创建的源文案");
    await fillFormItem(drawer, "English · en-US", "Created by Playwright");
    await fillFormItem(drawer, "日本語 · ja-JP", "Playwright で作成");
    await fillFormItem(drawer, "Español · es-ES", "Creado por Playwright");
    await fillFormItem(drawer, "业务模块", "QA 自动化");
    await fillFormItem(drawer, "上线版本", "e2e");
    await fillFormItem(drawer, "备注", "新增词条自动化场景");
    await drawer.getByRole("button", { name: zhText("保存") }).click();

    await expect(drawer).toBeHidden();
    await expect(page.getByText("qa.created.title")).toBeVisible();
    await expect(page.getByText("Playwright 创建的源文案")).toBeVisible();
  });

  test("新增时重复 Key 会阻止保存", async ({ page }) => {
    await page.getByRole("button", { name: /新增词条/ }).click();

    const drawer = entryDrawer(page);
    await fillFormItem(drawer, "唯一 Key", "auth.login.title");

    await expect(drawer.getByText("Key 已存在，请修改为唯一值")).toBeVisible();
    await expect(drawer.getByRole("button", { name: zhText("保存") })).toBeDisabled();
  });

  test("可以编辑已有词条源文案和译文", async ({ page }) => {
    await clickRowAction(page, "auth.login.title", 0);

    const drawer = entryDrawer(page);
    await expect(drawer).toBeVisible();
    await fillFormItem(drawer, "源语言文案", "登录你的账户 Playwright");
    await fillFormItem(drawer, "English · en-US", "Sign in with Playwright");
    await drawer.getByRole("button", { name: zhText("保存") }).click();

    await expect(page.getByText("登录你的账户 Playwright")).toBeVisible();
    await expect(page.getByText("Sign in with Playwright")).toBeVisible();
  });

  test("可以删除单条词条", async ({ page }) => {
    await clickRowAction(page, "order.list.empty", 2);
    await page.getByText("确定删除该词条？").waitFor();
    await page.getByRole("button", { name: zhText("删除") }).click();

    await expect(page.getByText("order.list.empty")).toHaveCount(0);
  });

  test("可以选择词条并批量迁移分组", async ({ page }) => {
    await selectTableRow(page, "auth.login.title");

    await expect(page.getByText("已选 1 条词条")).toBeVisible();
    await page.getByRole("button", { name: /迁移分组/ }).click();
    const dialog = activeModal(page, "批量迁移分组");
    await dialog.getByPlaceholder("例如 order.list").fill("qa.migrated");
    await dialog.getByRole("button", { name: zhText("迁移") }).click();

    await expect(tableRow(page, "auth.login.title").getByText("qa.migrated")).toBeVisible();
  });

  test("可以批量复制已选词条", async ({ page }) => {
    const rows = page.locator(".ant-table-tbody > tr.ant-table-row");
    const beforeCount = await rows.count();

    await selectTableRow(page, "auth.login.title");
    await page.getByRole("button", { name: /批量复制/ }).click();

    await expect(rows).toHaveCount(beforeCount + 1);
    await expect(page.getByText("批量复制")).toBeVisible();
  });

  test("可以使用本地模拟机器翻译填充空白译文", async ({ page }) => {
    await selectAntOption(page, ".provider-select", "本地模拟");
    await page.getByPlaceholder("搜索 key、译文、备注、标签").fill("order.list.empty");
    await page.getByPlaceholder("搜索 key、译文、备注、标签").press("Enter");

    await page.getByRole("button", { name: /机器翻译/ }).click();

    await expect(page.getByText(/已填充 \d+ 处译文/)).toBeVisible();
    await expect(tableRow(page, "order.list.empty").getByText("未填写")).toHaveCount(0);
  });

  test("切换项目会更新项目标题和词条列表", async ({ page }) => {
    await selectAntOption(page, ".project-select", "运营内容团队 / Dictly Docs");

    await expect(page.getByRole("heading", { name: "Dictly Docs" })).toBeVisible();
    await expect(page.getByText("docs.getting-started.title")).toBeVisible();
    await expect(page.getByText("auth.login.title")).toHaveCount(0);
  });
});
