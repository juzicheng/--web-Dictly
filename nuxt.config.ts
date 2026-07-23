export default defineNuxtConfig({
  compatibilityDate: "2026-07-23",
  devtools: { enabled: false },
  css: ["~/assets/styles/main.css", "ant-design-vue/dist/reset.css"],
  typescript: {
    strict: true,
    typeCheck: false,
  },
  vite: {
    cacheDir: "node_modules/.vite/dictly",
  },
});
