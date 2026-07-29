import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3010";
const demoDir = resolve("demo");
const serverCommand = process.env.E2E_WEB_SERVER_COMMAND ?? "pnpm dev --host 127.0.0.1 --port 3010";

function splitCommand(command) {
  return command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, "")) ?? [];
}

async function waitForServer(url, timeoutMs = 120_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.status < 500) {
        return true;
      }
    } catch {
      // Keep polling until the dev server is ready.
    }

    await new Promise((resolveTimer) => setTimeout(resolveTimer, 1_000));
  }

  return false;
}

function startServer() {
  const [command, ...args] = splitCommand(serverCommand);
  if (!command) {
    throw new Error("E2E_WEB_SERVER_COMMAND is empty");
  }

  const executable = process.platform === "win32" && command === "pnpm" ? "pnpm.cmd" : command;
  return spawn(executable, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
    stdio: "inherit",
  });
}

async function waitForNuxtHydrated(page) {
  await page.waitForFunction(() => {
    const root = document.querySelector("#__nuxt");
    return Boolean(root?.__vue_app__);
  });
}

async function gotoHydrated(page, path) {
  await page.goto(new URL(path, baseURL).toString());
  await waitForNuxtHydrated(page);
}

async function screenshot(page, filename) {
  await page.screenshot({
    path: resolve(demoDir, filename),
    fullPage: true,
  });
}

async function main() {
  await mkdir(demoDir, { recursive: true });

  let server;
  const alreadyRunning = await waitForServer(baseURL, 2_000);
  if (!alreadyRunning && !process.env.E2E_SKIP_WEB_SERVER) {
    server = startServer();
  }

  const ready = await waitForServer(baseURL);
  if (!ready) {
    throw new Error(`Nuxt dev server is not reachable at ${baseURL}`);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({
    locale: "zh-CN",
    viewport: { width: 1440, height: 1000 },
  });

  try {
    await gotoHydrated(page, "/login?redirect=/");
    await screenshot(page, "e2e-login.png");

    await page.getByLabel("账号").fill("user");
    await page.getByLabel("密码").fill("user123");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "翻译项目概览" })).toBeVisible();
    await screenshot(page, "e2e-dashboard.png");

    await page.getByRole("link", { name: /翻译工作台/ }).click();
    await expect(page).toHaveURL(/\/workspace$/);
    await expect(page.getByRole("heading", { name: "Dictly Commerce" })).toBeVisible();
    await screenshot(page, "e2e-workspace.png");

    const entryRow = page
      .locator(".ant-table-tbody > tr.ant-table-row", { hasText: "auth.login.title" })
      .first();
    await entryRow.locator("td").last().getByRole("button").first().click();
    const drawer = page.locator(".ant-drawer-content-wrapper", { hasText: "词条编辑" }).last();
    await expect(drawer).toBeVisible();
    await screenshot(page, "e2e-entry-editor.png");
    await drawer.getByRole("button", { name: /取\s*消/ }).click();
    await expect(drawer).toBeHidden();

    await page.locator(".toolbar-panel").getByRole("button", { name: /导入导出/ }).click();
    await expect(page.getByRole("tabpanel", { name: "导入导出" })).toBeVisible();
    await screenshot(page, "e2e-import-export.png");
  } finally {
    await browser.close();
    server?.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
