<script setup lang="ts">
import { computed } from "vue";
import {
  BellOutlined,
  CloudDownloadOutlined,
  DashboardOutlined,
  LogoutOutlined,
  SearchOutlined,
  SettingOutlined,
  TeamOutlined,
  TranslationOutlined,
} from "@ant-design/icons-vue";

const route = useRoute();
const auth = useAuth();

type WorkspaceTabKey = "entries" | "languages" | "assets" | "terms" | "collaboration";
type NavKey = "dashboard" | "workspace" | "assets" | "team" | "settings";

const workspaceNavByTab: Record<WorkspaceTabKey, Exclude<NavKey, "dashboard">> = {
  entries: "workspace",
  languages: "settings",
  assets: "assets",
  terms: "settings",
  collaboration: "team",
};

const navMeta: Record<NavKey, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "项目健康度与交付概览" },
  workspace: { title: "Workspace", subtitle: "词条生产、校验与交付" },
  assets: { title: "Assets", subtitle: "文件流转、格式转换与交付进度" },
  team: { title: "Team", subtitle: "角色协同、访问记录与项目审计" },
  settings: { title: "Settings", subtitle: "语言矩阵、术语库与翻译规范" },
};

function normalizeWorkspaceTab(tab: unknown): WorkspaceTabKey {
  const value = Array.isArray(tab) ? tab[0] : tab;

  return typeof value === "string" && value in workspaceNavByTab
    ? (value as WorkspaceTabKey)
    : "entries";
}

const activeNavKey = computed<NavKey>(() => {
  if (route.path !== "/workspace") {
    return "dashboard";
  }

  return workspaceNavByTab[normalizeWorkspaceTab(route.query.tab)];
});

const selectedKeys = computed(() => [activeNavKey.value]);
const pageTitle = computed(() => navMeta[activeNavKey.value].title);
const pageSubtitle = computed(() => navMeta[activeNavKey.value].subtitle);
const userAvatarSrc = "/images/avatar.jpg";
const avatarAlt = computed(() => `${auth.user.value?.displayName ?? "用户"}头像`);

const navItems = [
  { key: "dashboard", to: "/", label: "Dashboard", subLabel: "项目概览", icon: DashboardOutlined },
  {
    key: "workspace",
    to: "/workspace",
    label: "Workspace",
    subLabel: "翻译工作台",
    icon: TranslationOutlined,
  },
  {
    key: "assets",
    to: "/workspace?tab=assets",
    label: "Assets",
    subLabel: "导入导出",
    icon: CloudDownloadOutlined,
  },
  {
    key: "team",
    to: "/workspace?tab=collaboration",
    label: "Team",
    subLabel: "成员协作",
    icon: TeamOutlined,
  },
  {
    key: "settings",
    to: "/workspace?tab=languages",
    label: "Settings",
    subLabel: "语种术语",
    icon: SettingOutlined,
  },
];
</script>

<template>
  <div class="app-canvas">
    <a-layout class="app-frame" :has-sider="true">
      <a-layout-sider class="app-sidebar" width="248" theme="light">
        <NuxtLink class="brand" to="/">
          <span class="brand-mark">D</span>
          <span class="brand-name">Dictly</span>
        </NuxtLink>

        <a-menu class="side-menu" mode="inline" :selected-keys="selectedKeys">
          <a-menu-item v-for="item in navItems" :key="item.key">
            <NuxtLink :to="item.to" class="side-link">
              <component :is="item.icon" />
              <span class="side-copy">
                <span class="side-label">{{ item.label }}</span>
                <span class="side-sub">{{ item.subLabel }}</span>
              </span>
            </NuxtLink>
          </a-menu-item>
        </a-menu>

        <section class="sidebar-upgrade" aria-label="Dictly Pro">
          <span class="upgrade-mark">D</span>
          <strong>Upgrade Pro</strong>
          <span>术语冲突、质量校验和交付审计集中处理。</span>
          <a-button size="small" type="primary" @click="navigateTo('/workspace')">打开工作台</a-button>
        </section>
      </a-layout-sider>

      <a-layout class="app-main">
        <a-layout-header class="app-topbar">
          <div class="top-title">
            <h1>{{ pageTitle }}</h1>
            <span>{{ pageSubtitle }}</span>
          </div>

          <nav class="mobile-nav" aria-label="主导航">
            <NuxtLink v-for="item in navItems" :key="item.key" :to="item.to">
              {{ item.label }}
            </NuxtLink>
          </nav>

          <div class="top-actions">
            <a-input class="top-search" readonly placeholder="搜索项目、词条或术语">
              <template #prefix>
                <SearchOutlined />
              </template>
            </a-input>

            <a-tooltip title="通知">
              <a-button class="top-icon-button" type="text" shape="circle" aria-label="通知">
                <template #icon>
                  <BellOutlined />
                </template>
              </a-button>
            </a-tooltip>

            <div class="user-area">
              <a-avatar class="user-avatar" :size="34" :src="userAvatarSrc" :alt="avatarAlt" />
              <span class="user-copy">
                <span class="user-name">{{ auth.user.value?.displayName }}</span>
                <span class="user-tier">Premium</span>
              </span>
              <a-tooltip title="退出登录">
                <a-button class="logout-button" type="text" shape="circle" @click="auth.logout">
                  <template #icon>
                    <LogoutOutlined />
                  </template>
                </a-button>
              </a-tooltip>
            </div>
          </div>
        </a-layout-header>

        <a-layout-content class="app-content">
          <slot />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<style scoped>
.app-canvas {
  min-height: 100vh;
  padding: 24px;
  background: var(--dt-canvas);
}

.app-frame {
  display: flex;
  flex-direction: row;
  height: calc(100vh - 96px);
  width: min(100%, 1660px);
  min-height: 0;
  max-height: calc(100vh - 96px);
  margin: 0 auto;
  overflow: hidden;
  background: var(--dt-app);
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: var(--dt-frame-radius);
  box-shadow: 0 20px 80px rgba(20, 20, 28, 0.14);
}

.app-sidebar {
  background: var(--dt-surface);
  border-inline-end: 1px solid var(--dt-border);
}

.app-sidebar :deep(.ant-layout-sider-children) {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100%;
  padding: 24px 14px 18px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px 22px;
  color: var(--dt-text);
  font-weight: 800;
}

.brand-mark,
.upgrade-mark {
  display: inline-grid;
  place-items: center;
  color: #ffffff;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent),
    var(--dt-primary);
  box-shadow: inset 0 -8px 16px rgba(63, 44, 176, 0.18);
}

.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 1.15rem;
}

.brand-name {
  font-size: 1.28rem;
  letter-spacing: 0;
}

.side-menu {
  border-inline-end: 0;
  background: transparent;
}

.side-menu :deep(.ant-menu-item) {
  height: auto;
  min-height: 44px;
  margin: 0 0 8px;
  padding: 0 12px;
  color: var(--dt-muted);
  border-radius: var(--dt-radius);
}

.side-menu :deep(.ant-menu-item::after) {
  display: none;
}

.side-menu :deep(.ant-menu-item-selected) {
  color: var(--dt-primary-strong);
  background: var(--dt-primary-soft);
}

.side-menu :deep(.ant-menu-item:hover) {
  color: var(--dt-primary-strong);
  background: #f7f4ff;
}

.side-menu :deep(.ant-menu-title-content) {
  margin-inline-start: 0;
}

.side-link {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding-block: 8px;
}

.side-link :deep(.anticon) {
  flex: 0 0 auto;
  font-size: 1.05rem;
}

.side-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
  line-height: 1.1;
}

.side-label {
  color: inherit;
  font-size: 0.9rem;
  font-weight: 750;
}

.side-sub {
  color: var(--dt-faint);
  font-size: 0.74rem;
}

.sidebar-upgrade {
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 18px 14px;
  overflow: hidden;
  color: var(--dt-muted);
  text-align: center;
  background:
    radial-gradient(circle at 24% 0%, rgba(116, 87, 244, 0.24), transparent 34%),
    linear-gradient(180deg, #fbfaff, #ffffff);
  border: 1px solid var(--dt-border);
  border-radius: var(--dt-radius);
}

.upgrade-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-weight: 800;
}

.sidebar-upgrade strong {
  color: var(--dt-text);
}

.sidebar-upgrade span:last-of-type {
  max-width: 170px;
  font-size: 0.76rem;
  line-height: 1.55;
}

.app-main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  background: var(--dt-app);
}

.app-topbar {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 74px;
  padding: 0 22px;
  background: var(--dt-surface);
  border-bottom: 1px solid var(--dt-border);
}

:global(.ant-layout.app-frame .ant-layout-header.app-topbar) {
  display: flex;
  height: 74px;
  padding: 0 22px;
  line-height: normal;
  background: var(--dt-surface);
}

.top-title {
  display: grid;
  gap: 3px;
  min-width: 150px;
  margin-inline-end: auto;
}

.top-title h1 {
  margin: 0;
  color: var(--dt-text);
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0;
}

.top-title span {
  color: var(--dt-muted);
  font-size: 0.8rem;
}

.mobile-nav {
  display: none;
  gap: 8px;
  align-items: center;
}

.mobile-nav a {
  padding: 6px 10px;
  color: var(--dt-muted);
  background: var(--dt-surface-soft);
  border-radius: var(--dt-radius);
  font-size: 0.78rem;
  font-weight: 750;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.top-search {
  width: min(360px, 28vw);
}

.top-icon-button,
.logout-button {
  width: 38px;
  height: 38px;
  color: var(--dt-text);
  background: var(--dt-surface-soft);
  border: 1px solid var(--dt-border);
}

.user-area {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 4px 6px 4px 4px;
  background: var(--dt-surface);
  border: 1px solid transparent;
  border-radius: var(--dt-radius);
}

.user-avatar {
  flex: 0 0 auto;
  background: var(--dt-surface-soft);
  border: 1px solid var(--dt-border);
}

.user-avatar :deep(img) {
  object-fit: cover;
}

.user-copy {
  display: grid;
  min-width: 86px;
  line-height: 1.1;
}

.user-name {
  color: var(--dt-text);
  font-size: 0.84rem;
  font-weight: 750;
  white-space: nowrap;
}

.user-tier {
  margin-top: 3px;
  color: var(--dt-muted);
  font-size: 0.72rem;
}

.app-content {
  flex: 1 1 auto;
  min-height: 0;
  padding: 12px;
  overflow: auto;
  background: var(--dt-app);
  scrollbar-gutter: stable;
}

@media (max-width: 64em) {
  .app-canvas {
    padding: 0;
  }

  .app-frame {
    height: 100vh;
    min-height: 100vh;
    max-height: 100vh;
    border: 0;
    border-radius: 0;
  }

  .app-sidebar {
    display: none;
  }

  .mobile-nav {
    display: flex;
  }

  .top-search {
    display: none;
  }
}

@media (max-width: 48em) {
  .app-topbar {
    height: auto;
    min-height: 72px;
    flex-wrap: wrap;
    padding: 12px;
  }

  :global(.ant-layout.app-frame .ant-layout-header.app-topbar) {
    height: auto;
    min-height: 72px;
    padding: 12px;
  }

  .top-actions {
    width: 100%;
    justify-content: space-between;
  }

  .user-copy {
    min-width: 0;
  }

  .user-tier {
    display: none;
  }

  .app-content {
    padding: 10px;
  }
}

@media (max-width: 36em) {
  .top-title span,
  .user-name {
    display: none;
  }

  .mobile-nav {
    width: 100%;
  }

  .mobile-nav a {
    flex: 1;
    text-align: center;
  }
}
</style>
