import { expect, test, type Locator, type Page } from "@playwright/test";
import { activeModal, fillFormItem, zhText } from "./helpers/ant";
import { loginByApi } from "./helpers/auth";
import { gotoHydrated } from "./helpers/nuxt";

async function openDashboard(page: Page) {
  await loginByApi(page);
  await gotoHydrated(page, "/");
  await expect(page.getByRole("heading", { name: "翻译项目概览" })).toBeVisible();
}

function projectCard(page: Page, projectName: string): Locator {
  return page
    .locator(".project-card", { has: page.getByRole("heading", { name: projectName, exact: true }) })
    .first();
}

function projectSection(page: Page): Locator {
  return page.locator(".project-section").first();
}

async function openProjectMenu(page: Page, projectName: string) {
  const card = projectCard(page, projectName);
  await expect(card).toBeVisible();
  await card.getByLabel("项目操作").click();
}

test.describe("Dashboard 项目概览", () => {
  test.beforeEach(async ({ page }) => {
    await openDashboard(page);
  });

  test("@smoke 显示用户信息、指标和项目卡片", async ({ page }) => {
    await expect(page.getByText("当前身份：普通用户 · user@dictly.local")).toBeVisible();
    await expect(page.getByText("可访问项目")).toBeVisible();
    await expect(page.getByText("词条总数")).toBeVisible();
    await expect(page.getByText("启用语种")).toBeVisible();
    await expect(page.getByText("待处理")).toBeVisible();
    await expect(page.getByText("已审核")).toBeVisible();
    await expect(page.getByText("Dictly Commerce")).toBeVisible();
    await expect(page.getByText("Dictly Docs")).toBeVisible();
  });

  test("点击进入工作台按钮会打开当前项目工作台", async ({ page }) => {
    await projectSection(page).getByRole("button", { name: /进入工作台/ }).click();

    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole("heading", { name: "Dictly Commerce" })).toBeVisible();
  });

  test("点击项目卡片会打开对应项目工作台", async ({ page }) => {
    await projectCard(page, "Dictly Finance").click();

    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole("heading", { name: "Dictly Finance" })).toBeVisible();
  });

  test("可以从项目菜单创建副本", async ({ page }) => {
    await openProjectMenu(page, "Dictly Commerce");
    await page.getByRole("menuitem", { name: /创建副本/ }).click();

    await expect(page.getByRole("heading", { name: "Dictly Commerce 副本" })).toBeVisible();
    await expect(page.getByText("已创建「Dictly Commerce 副本」")).toBeVisible();
  });

  test("可以编辑项目基础信息", async ({ page }) => {
    await openProjectMenu(page, "Dictly Commerce");
    await page.getByRole("menuitem", { name: /编辑/ }).click();

    const dialog = activeModal(page, "编辑项目");
    await fillFormItem(dialog, "项目名称", "Dictly Commerce QA");
    await fillFormItem(dialog, "团队名称", "质量保障团队");
    await fillFormItem(dialog, "项目描述", "由 Playwright 覆盖的项目编辑流程。");
    await fillFormItem(dialog, "模块", "Web端，QA自动化");
    await dialog.getByRole("button", { name: zhText("保存") }).click();

    const updatedCard = projectCard(page, "Dictly Commerce QA");
    await expect(updatedCard).toBeVisible();
    await expect(updatedCard.getByText("质量保障团队")).toBeVisible();
    await expect(page.getByText("项目已更新")).toBeVisible();
  });

  test("可以删除非当前项目", async ({ page }) => {
    await openProjectMenu(page, "Dictly Docs");
    await page.getByRole("menuitem", { name: /删除/ }).click();

    const confirm = activeModal(page, "删除项目");
    await expect(confirm.getByText("确定删除「Dictly Docs」？")).toBeVisible();
    await confirm.getByRole("button", { name: zhText("删除") }).click();

    await expect(projectCard(page, "Dictly Docs")).toHaveCount(0);
    await expect(page.getByText("项目已删除")).toBeVisible();
  });
});
