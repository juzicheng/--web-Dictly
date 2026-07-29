import { expect, type Page } from "@playwright/test";
import { loginByApi } from "./auth";
import { gotoHydrated } from "./nuxt";

export async function openWorkspace(page: Page) {
  await loginByApi(page);
  await gotoHydrated(page, "/workspace");
  await expect(page.getByRole("heading", { name: "Dictly Commerce" })).toBeVisible();
  await expect(page.getByText("auth.login.title")).toBeVisible();
}

export function tableRow(page: Page, text: string) {
  return page.locator(".ant-table-tbody > tr.ant-table-row", { hasText: text }).first();
}

export async function clickRowAction(page: Page, rowText: string, actionIndex: number) {
  const row = tableRow(page, rowText);
  await expect(row).toBeVisible();
  await row.locator("td").last().getByRole("button").nth(actionIndex).click();
}

export async function selectTableRow(page: Page, rowText: string) {
  const row = tableRow(page, rowText);
  await expect(row).toBeVisible();
  await row.locator(".ant-checkbox-wrapper").first().click();
}
