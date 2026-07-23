<script setup lang="ts">
import { shallowRef, watch } from "vue";
import type { MachineProvider } from "../../types/dictly";
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
    <div class="toolbar-row">
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
        class="compact-select"
        :value="workspace.filters.value.group"
        @update:value="(value: unknown) => workspace.setFilter('group', String(value))"
      >
        <a-select-option value="all">全部分组</a-select-option>
        <a-select-option v-for="group in workspace.groups.value" :key="group" :value="group">
          {{ group }}
        </a-select-option>
      </a-select>
    </div>

    <div class="toolbar-row split-row">
      <a-space wrap>
        <a-checkbox
          :checked="workspace.filters.value.onlyUntranslated"
          @update:checked="
            (value: unknown) => workspace.setFilter('onlyUntranslated', Boolean(value))
          "
        >
          未翻译
        </a-checkbox>
      </a-space>

      <a-space wrap>
        <a-select
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

.search-input {
  width: min(420px, 100%);
}

.compact-select {
  width: 190px;
}

.provider-select {
  width: 180px;
}

.split-row {
  justify-content: space-between;
}

@media (max-width: 760px) {
  .search-input,
  .compact-select,
  .provider-select {
    width: 100%;
  }

  .split-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
