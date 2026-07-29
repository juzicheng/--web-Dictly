import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { zhText } from "./ant";
import { gotoHydrated } from "./nuxt";

export const users = {
  user: {
    username: "user",
    password: "user123",
    displayName: "普通用户",
    roleLabel: "普通用户",
    email: "user@dictly.local",
  },
  admin: {
    username: "admin",
    password: "admin123",
    displayName: "管理员",
    roleLabel: "管理员",
    email: "admin@dictly.local",
  },
} as const;

export type SeedUser = keyof typeof users;

export async function loginByApi(page: Page, seedUser: SeedUser = "user") {
  await page.context().clearCookies();

  const account = users[seedUser];
  const response = await page.request.post("/api/auth/login", {
    data: {
      username: account.username,
      password: account.password,
    },
  });

  expect(response.ok()).toBeTruthy();
}

export async function loginByUi(page: Page, seedUser: SeedUser = "user") {
  const account = users[seedUser];

  await gotoHydrated(page, "/login");
  await page.getByLabel("账号").fill(account.username);
  await page.getByLabel("密码").fill(account.password);
  await page.getByRole("button", { name: zhText("登录") }).click();
}

export async function loginRequest(request: APIRequestContext, seedUser: SeedUser = "user") {
  const account = users[seedUser];

  const response = await request.post("/api/auth/login", {
    data: {
      username: account.username,
      password: account.password,
    },
  });

  expect(response.ok()).toBeTruthy();
  return response;
}
