import { expect, type Locator, type Page } from "@playwright/test";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function zhText(value: string) {
  return new RegExp(Array.from(value).map(escapeRegExp).join("\\s*"));
}

export async function selectAntOption(page: Page, trigger: Locator | string, optionText: string) {
  const triggerLocator = typeof trigger === "string" ? page.locator(trigger) : trigger;

  await triggerLocator.click();
  const dropdown = page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)").last();
  await expect(dropdown).toBeVisible();
  await dropdown.getByText(optionText, { exact: true }).click();
}

export async function fillFormItem(root: Locator, label: string, value: string) {
  const item = root.locator(".ant-form-item", { hasText: label }).first();
  await expect(item).toBeVisible();
  await item.locator("input, textarea").first().fill(value);
}

export function activeModal(page: Page, title: string) {
  return page.locator(".ant-modal-content", { hasText: title }).last();
}

export function activePopover(page: Page, text: string) {
  return page.locator(".ant-popover", { hasText: text }).last();
}

export function entryDrawer(page: Page) {
  return page.locator(".ant-drawer-content-wrapper", { hasText: "词条编辑" }).last();
}
