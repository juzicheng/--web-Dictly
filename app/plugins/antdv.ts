import Antd, { StyleProvider } from "ant-design-vue";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Antd);
  if (!nuxtApp.vueApp.component("AStyleProvider")) {
    nuxtApp.vueApp.component("AStyleProvider", StyleProvider);
  }
});
