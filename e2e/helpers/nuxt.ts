import type { Page } from "@playwright/test";

export async function waitForNuxtHydrated(page: Page) {
  await page.waitForFunction(() => {
    const root = document.querySelector("#__nuxt") as (Element & { __vue_app__?: unknown }) | null;
    return Boolean(root?.__vue_app__);
  });
}

export async function gotoHydrated(page: Page, url: string) {
  await page.goto(url);
  await waitForNuxtHydrated(page);
}
