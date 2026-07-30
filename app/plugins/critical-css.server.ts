import { defineNuxtPlugin, useServerHead } from "#app";
import { criticalCss } from "~/assets/styles/critical-css";

export default defineNuxtPlugin((): void => {
  useServerHead({
    style: [
      {
        id: "dictly-critical-css",
        "data-critical": "true",
        innerHTML: criticalCss,
      },
    ],
  });
});
