import { createApp, defineComponent, h, shallowRef } from "vue";
import { defineNuxtPlugin } from "#app";
import { StartupLoading } from "#components";
import type { App, ShallowRef } from "vue";
import type { NuxtApp } from "#app";

type StartupLoadingBridge = {
  markAppReady: () => void;
  markAppMounted: () => void;
};

type StartupLoadingHandle = {
  app: App<Element>;
  host: HTMLElement;
  leaving: ShallowRef<boolean>;
};

declare global {
  interface Window {
    __DICTLY_APP_MOUNTED__?: boolean;
    __DICTLY_STARTUP_LOADING__?: StartupLoadingBridge;
  }
}

const startupLoadingHostId = "dictly-startup-loading-host";
const startupLoadingMinVisibleMs = 220;
const startupLoadingLeaveMs = 200;
const criticalStyleTimeoutMs = 2000;
const requiredStableFrames = 1;

function now() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function isFlexDisplay(element: Element | null) {
  return element ? getComputedStyle(element).display.endsWith("flex") : true;
}

function hasReadyPageLayout() {
  const appFrame = document.querySelector(".app-frame");
  if (appFrame) {
    const style = getComputedStyle(appFrame);
    return style.display === "flex" && style.flexDirection === "row";
  }

  const loginPage = document.querySelector(".login-page");
  if (loginPage) {
    return getComputedStyle(loginPage).display === "grid";
  }

  return Boolean(document.querySelector("#__nuxt")?.textContent?.trim());
}

function hasReadyAntStyles() {
  return isFlexDisplay(document.querySelector(".ant-btn"));
}

function markStartupLoadingDone() {
  document.documentElement.classList.add("dictly-startup-loading--done");
  document.documentElement.classList.remove("dictly-startup-loading--active");
}

function mountStartupLoading() {
  document.documentElement.classList.add("dictly-startup-loading--active");
  document.documentElement.classList.remove("dictly-startup-loading--done");

  document.getElementById(startupLoadingHostId)?.remove();

  const host = document.createElement("div");
  host.id = startupLoadingHostId;
  document.body.append(host);

  const leaving = shallowRef(false);
  const StartupLoadingRoot = defineComponent({
    name: "StartupLoadingRoot",
    setup() {
      return () => h(StartupLoading, { leaving: leaving.value });
    },
  });

  const app = createApp(StartupLoadingRoot);
  app.mount(host);

  return { app, host, leaving };
}

function removeStartupLoading(handle: StartupLoadingHandle | null) {
  if (!handle) {
    markStartupLoadingDone();
    return;
  }

  handle.leaving.value = true;
  window.setTimeout(() => {
    handle.app.unmount();
    handle.host.remove();
    markStartupLoadingDone();
  }, startupLoadingLeaveMs);
}

function waitForCriticalStyles() {
  return new Promise<void>((resolve) => {
    const startedAt = now();
    let stableFrames = 0;

    function check() {
      const ready = hasReadyPageLayout() && hasReadyAntStyles();

      stableFrames = ready ? stableFrames + 1 : 0;
      if (stableFrames >= requiredStableFrames || now() - startedAt > criticalStyleTimeoutMs) {
        resolve();
        return;
      }

      requestAnimationFrame(check);
    }

    requestAnimationFrame(check);
  });
}

export default defineNuxtPlugin((nuxtApp: NuxtApp): void => {
  const startedAt = now();
  const loader = mountStartupLoading();
  let hidden = false;

  function markAppReady() {
    if (hidden) {
      return;
    }

    hidden = true;
    const remaining = startupLoadingMinVisibleMs - (now() - startedAt);
    window.setTimeout(() => removeStartupLoading(loader), Math.max(2000, remaining));
  }

  window.__DICTLY_STARTUP_LOADING__ = {
    markAppReady,
    markAppMounted: markAppReady,
  };

  nuxtApp.hook("app:mounted", () => {
    window.__DICTLY_APP_MOUNTED__ = true;
    void waitForCriticalStyles().then(markAppReady);
  });
});
