export default defineNuxtConfig({
  compatibilityDate: "2026-07-23",
  devtools: { enabled: false },
  modules: ["@ant-design-vue/nuxt"],
  antd: {
    extractStyle: true,
  },
  css: [
    "ant-design-vue/dist/reset.css",
    "~/assets/styles/main.css",
  ],
  typescript: {
    strict: true,
    typeCheck: false,
  },
  vite: {
    cacheDir: "node_modules/.vite/dictly",
  },
});
