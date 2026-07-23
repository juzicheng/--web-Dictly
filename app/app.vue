<script setup lang="ts">
const theme = {
  token: {
    colorPrimary: "#1f6feb",
    colorSuccess: "#2da44e",
    colorWarning: "#bf8700",
    colorError: "#cf222e",
    borderRadius: 6,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Card: {
      borderRadiusLG: 8,
    },
    Button: {
      borderRadius: 6,
    },
  },
};
</script>

<template>
  <AStyleProvider hash-priority="high">
    <AConfigProvider :theme="theme">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </AConfigProvider>
  </AStyleProvider>
</template>
