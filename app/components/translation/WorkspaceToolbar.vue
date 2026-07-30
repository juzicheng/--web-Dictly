<script setup lang="ts">
import { shallowRef, watch } from "vue";
import type { EntryStatus, MachineProvider } from "../../types/dictly";
import {
  ApiOutlined,
  CloudDownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

const emit = defineEmits<{
  createEntry: [];
  openImportExport: [];
}>();

const workspace = useWorkspace();
const searchDraft = shallowRef(workspace.filters.value.query);

const providerOptions: Array<{ label: string; value: MachineProvider }> = [
  { label: "MyMemory 免 Token", value: "mymemory" },
  { label: "本地模拟", value: "local" },
];
const statusOptions: Array<{ label: string; value: EntryStatus | "all" }> = [
  { label: "全部", value: "all" },
  { label: "草稿", value: "draft" },
  { label: "待审核", value: "reviewing" },
  { label: "已通过", value: "approved" },
  { label: "过期", value: "outdated" },
];

watch(
  () => workspace.filters.value.query,
  (query) => {
    searchDraft.value = query;
  },
);

function applySearch(value?: string) {
  if (typeof value === "string") {
    searchDraft.value = value;
  }
  workspace.setFilter("query", searchDraft.value.trim());
}

function updateSearchDraft(value: unknown) {
  searchDraft.value = String(value ?? "");
}

async function handleAutoTranslate() {
  const result = await workspace.autoTranslateSelected();

  if (result.changedCount) {
    message.success(`已填充 ${result.changedCount} 处译文`);
    return;
  }

  if (!result.locales.length) {
    message.info("当前项目没有可翻译的目标语种");
    return;
  }

  if (!result.requestedCount) {
    message.info("当前筛选范围没有词条");
    return;
  }

  message.info("当前筛选范围没有空白译文需要填充");
}
</script>

<template>
  <section class="section-band toolbar-panel">
    <div class="toolbar-main">
      <a-input-search
        class="search-input"
        allow-clear
        enter-button="搜索"
        :value="searchDraft"
        placeholder="搜索 key、译文、备注、标签"
        @update:value="updateSearchDraft"
        @search="applySearch"
      />

      <a-select
        id="dictly-group-select"
        class="compact-select"
        :value="workspace.filters.value.group"
        @update:value="(value: unknown) => workspace.setFilter('group', String(value))"
      >
        <a-select-option value="all">全部分组</a-select-option>
        <a-select-option v-for="group in workspace.groups.value" :key="group" :value="group">
          {{ group }}
        </a-select-option>
      </a-select>

      <a-segmented
        class="status-filter"
        :value="workspace.filters.value.status"
        :options="statusOptions"
        @update:value="
          (value: unknown) => workspace.setFilter('status', value as EntryStatus | 'all')
        "
      />
    </div>

    <div class="toolbar-actions">
      <div class="quick-checks">
        <a-checkbox
          :checked="workspace.filters.value.onlyUntranslated"
          @update:checked="
            (value: unknown) => workspace.setFilter('onlyUntranslated', Boolean(value))
          "
        >
          未翻译
        </a-checkbox>
        <a-checkbox
          :checked="workspace.filters.value.onlyReviewing"
          @update:checked="(value: unknown) => workspace.setFilter('onlyReviewing', Boolean(value))"
        >
          待复核
        </a-checkbox>
        <a-checkbox
          :checked="workspace.filters.value.onlyOutdated"
          @update:checked="(value: unknown) => workspace.setFilter('onlyOutdated', Boolean(value))"
        >
          已过期
        </a-checkbox>
      </div>

      <a-space wrap class="action-cluster">
        <a-select
          id="dictly-provider-select"
          class="provider-select"
          :value="workspace.machineProvider.value"
          :options="providerOptions"
          @update:value="(value: unknown) => workspace.setMachineProvider(value as MachineProvider)"
        />
        <a-tooltip title="批量自动填充当前筛选或已选词条">
          <a-button :loading="workspace.machineBusy.value" @click="handleAutoTranslate">
            <template #icon>
              <ApiOutlined />
            </template>
            机器翻译
          </a-button>
        </a-tooltip>
        <a-button @click="emit('openImportExport')">
          <template #icon>
            <CloudDownloadOutlined />
          </template>
          导入导出
        </a-button>
        <a-button @click="workspace.resetFilters">
          <template #icon>
            <ReloadOutlined />
          </template>
          重置
        </a-button>
        <a-button type="primary" @click="emit('createEntry')">
          <template #icon>
            <PlusOutlined />
          </template>
          新增词条
        </a-button>
      </a-space>
    </div>
  </section>
</template>

<style scoped>
.toolbar-panel {
  display: grid;
  gap: 12px;
}

.toolbar-main,
.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.search-input {
  flex: 1 1 360px;
  min-width: 240px;
  max-width: 520px;
}

.compact-select {
  flex: 0 0 180px;
}

.status-filter {
  flex: 0 1 auto;
}

.quick-checks,
.action-cluster {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.quick-checks {
  color: var(--dt-muted);
  font-weight: 650;
}

.provider-select {
  width: 180px;
}

@media (max-width: 74em) {
  .toolbar-main,
  .toolbar-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input,
  .compact-select,
  .status-filter,
  .provider-select {
    width: 100%;
    max-width: none;
  }

  .search-input,
  .compact-select,
  .status-filter {
    flex: 0 1 auto;
  }
}
</style>
