import { defineNuxtPlugin, useServerHead } from "#app";
import criticalCss from "~/assets/styles/critical-css.scss?raw";
import startupLoadingCss from "~/assets/styles/startup-loading.scss?inline";

const inlineCriticalCss = `${criticalCss}\n${startupLoadingCss}`;

export default defineNuxtPlugin((): void => {
  useServerHead({
    style: [
      {
        id: "dictly-critical-css",
        "data-critical": "true",
        innerHTML: inlineCriticalCss,
      },
    ],
  });
});
