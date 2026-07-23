<script setup lang="ts">
import { computed } from "vue";
import {
  DashboardOutlined,
  LogoutOutlined,
  TranslationOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";

const route = useRoute();
const auth = useAuth();

const selectedKeys = computed(() => [route.path === "/workspace" ? "workspace" : "dashboard"]);
const headerStyle = {
  background: "rgba(255, 255, 255, 0.96)",
  color: "#24292f",
};
</script>

<template>
  <a-layout class="app-shell">
    <a-layout-header class="app-header" :style="headerStyle">
      <NuxtLink class="brand" to="/">
        <span class="brand-mark">D</span>
        <span class="brand-name">Dictly</span>
      </NuxtLink>

      <a-menu class="nav-menu" mode="horizontal" :selected-keys="selectedKeys">
        <a-menu-item key="dashboard">
          <NuxtLink to="/">
            <DashboardOutlined />
            <span>首页</span>
          </NuxtLink>
        </a-menu-item>
        <a-menu-item key="workspace">
          <NuxtLink to="/workspace">
            <TranslationOutlined />
            <span>翻译工作台</span>
          </NuxtLink>
        </a-menu-item>
      </a-menu>

      <a-space class="user-area" :size="12">
        <a-avatar :size="32">
          <template #icon>
            <UserOutlined />
          </template>
        </a-avatar>
        <span class="user-name">{{ auth.user.value?.displayName }}</span>
        <a-tooltip title="退出登录">
          <a-button type="text" shape="circle" @click="auth.logout">
            <template #icon>
              <LogoutOutlined />
            </template>
          </a-button>
        </a-tooltip>
      </a-space>
    </a-layout-header>

    <a-layout-content class="app-content">
      <slot />
    </a-layout-content>
  </a-layout>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f6f8fa;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 20px;
  height: 58px;
  padding: 0 28px;
  color: #24292f;
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid #d8dee4;
  box-shadow: 0 1px 2px rgba(27, 31, 36, 0.04);
  backdrop-filter: blur(10px);
}

:global(.ant-layout-header.app-header) {
  background: rgba(255, 255, 255, 0.96);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #24292f;
  font-weight: 700;
  text-decoration: none;
}

.brand-mark {
  display: inline-grid;
  width: 30px;
  height: 30px;
  line-height: 30px;
  place-items: center;
  color: #ffffff;
  background: #1f6feb;
  border-radius: 6px;
}

.brand-name {
  font-size: 18px;
  color: #24292f;
}

.nav-menu {
  flex: 1;
  min-width: 0;
  border-bottom: 0;
  background: transparent;
}

.nav-menu :deep(.ant-menu-item) {
  color: #57606a;
}

.nav-menu :deep(.ant-menu-item-selected) {
  color: #0969da;
}

.nav-menu :deep(.ant-menu-item:hover) {
  color: #0969da;
  background: #eef4ff;
}

.nav-menu :deep(.ant-menu-title-content a) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.user-area {
  flex: 0 0 auto;
}

.user-name {
  color: #57606a;
  white-space: nowrap;
}

.user-area :deep(.ant-btn-text) {
  color: #57606a;
}

.user-area :deep(.ant-btn-text:hover) {
  color: #0969da;
  background: #eef4ff;
}

.app-content {
  padding: 24px;
}

@media (max-width: 760px) {
  .app-header {
    gap: 10px;
    padding: 0 12px;
  }

  .brand-name,
  .user-name {
    display: none;
  }

  .app-content {
    padding: 14px;
  }
}
</style>
