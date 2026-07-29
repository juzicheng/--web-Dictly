import { expect, test } from "@playwright/test";
import { zhText } from "./helpers/ant";
import { loginByApi, loginByUi, users } from "./helpers/auth";
import { gotoHydrated } from "./helpers/nuxt";

test.describe("认证与路由保护", () => {
  test("@smoke 未登录访问工作台会跳转到登录页并保留 redirect", async ({ page }) => {
    await page.goto("/workspace");

    await expect(page).toHaveURL(/\/login\?redirect=.*workspace/);
    await expect(page.getByRole("heading", { name: "多语言翻译管理平台" })).toBeVisible();
  });

  test("@smoke 普通用户可以登录并进入 redirect 目标页", async ({ page }) => {
    await gotoHydrated(page, "/login?redirect=/workspace");
    await page.getByLabel("账号").fill(users.user.username);
    await page.getByLabel("密码").fill(users.user.password);
    await page.getByRole("button", { name: zhText("登录") }).click();

    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole("heading", { name: "Dictly Commerce" })).toBeVisible();
  });

  test("管理员登录后首页显示管理员身份", async ({ page }) => {
    await loginByUi(page, "admin");

    await expect(page).toHaveURL(/\/$/, { timeout: 3000 });
    await expect(page.getByText("当前身份：管理员 · admin@dictly.local")).toBeVisible();
    await expect(page.locator(".user-name").getByText("管理员", { exact: true })).toBeVisible();
  });

  test("错误密码会显示错误信息并停留在登录页", async ({ page }) => {
    await gotoHydrated(page, "/login");
    await page.getByLabel("账号").fill("user");
    await page.getByLabel("密码").fill("wrong-password");
    await page.getByRole("button", { name: zhText("登录") }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("alert")).toContainText("401 Unauthorized");
  });

  test("已登录用户访问登录页会自动回到首页", async ({ page }) => {
    await loginByApi(page);
    await gotoHydrated(page, "/login");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "翻译项目概览" })).toBeVisible();
  });

  test("退出登录后回到登录页，并且不能继续访问首页", async ({ page }) => {
    await loginByApi(page);
    await gotoHydrated(page, "/");

    await page.locator(".user-area button").click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/");
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });
});
