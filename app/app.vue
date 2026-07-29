<script setup lang="ts">
const theme = {
  token: {
    colorPrimary: "#7457f4",
    colorSuccess: "#20c986",
    colorWarning: "#f4b740",
    colorError: "#e6526f",
    colorInfo: "#35bfe8",
    colorText: "#15151a",
    colorTextSecondary: "#6f707b",
    colorBorder: "#eceaf2",
    colorBgContainer: "#ffffff",
    colorBgLayout: "#f4f5f7",
    borderRadius: 8,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    boxShadowTertiary: "0 12px 30px rgba(22, 22, 30, 0.06)",
  },
  components: {
    Card: {
      borderRadiusLG: 8,
      paddingLG: 18,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 38,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Table: {
      headerBg: "#fafafd",
      headerColor: "#71717c",
      rowHoverBg: "#faf9ff",
      borderColor: "#f0eef5",
    },
    Tabs: {
      inkBarColor: "#7457f4",
      itemSelectedColor: "#5f45df",
      itemHoverColor: "#5f45df",
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
