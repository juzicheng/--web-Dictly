<script setup lang="ts">
import { computed, shallowRef } from "vue";
import type { ExportFormat, ImportFormat } from "../../types/dictly";
import { CloudDownloadOutlined, InboxOutlined } from "@ant-design/icons-vue";

const workspace = useWorkspace();

const importFormat = shallowRef<ImportFormat>("json");
const exportFormat = shallowRef<ExportFormat>("json");
const file = shallowRef<File | null>(null);

const formatOptions: Array<{ label: string; value: ImportFormat }> = [
  { label: "JSON", value: "json" },
  { label: "YAML", value: "yaml" },
  { label: "Android strings.xml", value: "android-xml" },
  { label: "iOS .xcstrings", value: "ios-xcstrings" },
  { label: "Excel/CSV", value: "csv" },
  { label: "iOS .strings", value: "ios-strings" },
];

const localeOptions = computed(() =>
  workspace.enabledLocales.value.map((locale) => ({
    label: `${locale.name} · ${locale.code}`,
    value: locale.code,
  })),
);

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  file.value = target.files?.[0] ?? null;
}

async function submitImport() {
  if (!file.value) {
    return;
  }

  await workspace.importFile(file.value, importFormat.value, workspace.filters.value.locale);
  file.value = null;
}
</script>

<template>
  <section class="import-export-grid">
    <a-card class="dense-card" title="导入任务">
      <a-space direction="vertical" :size="14" class="full-width">
        <a-alert
          type="info"
          show-icon
          message="支持 JSON、YAML、Android XML、iOS .xcstrings、CSV 和 iOS .strings，用于存量迁移。"
        />

        <a-space wrap>
          <a-select v-model:value="importFormat" class="format-select" :options="formatOptions" />
          <a-select
            :value="workspace.filters.value.locale"
            class="format-select"
            :options="localeOptions"
            @update:value="(value: unknown) => workspace.setFilter('locale', String(value))"
          />
        </a-space>

        <label class="file-drop">
          <InboxOutlined />
          <span>{{ file?.name || "选择要导入的文件" }}</span>
          <input type="file" @change="handleFileChange" />
        </label>

        <a-button
          type="primary"
          :disabled="!file"
          :loading="workspace.importBusy.value"
          @click="submitImport"
        >
          开始导入
        </a-button>

        <a-list :data-source="workspace.currentProject.value?.importTasks ?? []" size="small">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.filename" :description="item.message">
                <template #avatar>
                  <a-progress type="circle" :percent="item.progress" :size="42" />
                </template>
              </a-list-item-meta>
              <a-tag
                :color="
                  item.status === 'done'
                    ? 'success'
                    : item.status === 'failed'
                      ? 'error'
                      : 'processing'
                "
              >
                {{ item.status }}
              </a-tag>
            </a-list-item>
          </template>
        </a-list>
      </a-space>
    </a-card>

    <a-card class="dense-card" title="导出目标">
      <a-space direction="vertical" :size="14" class="full-width">
        <a-alert
          type="success"
          show-icon
          message="导出会生成前端扁平 JSON、Android XML、iOS、YAML 或 CSV 交付文件。"
        />

        <a-space wrap>
          <a-select v-model:value="exportFormat" class="format-select" :options="formatOptions" />
          <a-select
            :value="workspace.filters.value.locale"
            class="format-select"
            :options="localeOptions"
            @update:value="(value: unknown) => workspace.setFilter('locale', String(value))"
          />
          <a-button
            type="primary"
            @click="workspace.exportEntries(exportFormat, workspace.filters.value.locale)"
          >
            <template #icon>
              <CloudDownloadOutlined />
            </template>
            导出文件
          </a-button>
        </a-space>

        <a-list :data-source="workspace.currentProject.value?.exportTargets ?? []" size="small">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta
                :title="item.name"
                :description="`${item.locale} · ${item.format}`"
              />
              <a-tag :color="item.status === 'done' ? 'success' : 'blue'">{{ item.status }}</a-tag>
            </a-list-item>
          </template>
        </a-list>
      </a-space>
    </a-card>
  </section>
</template>

<style scoped>
.import-export-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.full-width {
  width: 100%;
}

.format-select {
  width: 210px;
}

.file-drop {
  display: grid;
  min-height: 112px;
  place-items: center;
  gap: 8px;
  padding: 18px;
  color: #57606a;
  text-align: center;
  cursor: pointer;
  background: #f6f8fa;
  border: 1px dashed #8c959f;
  border-radius: 8px;
}

.file-drop :deep(svg) {
  color: #1f6feb;
  font-size: 28px;
}

.file-drop input {
  display: none;
}

@media (max-width: 980px) {
  .import-export-grid {
    grid-template-columns: 1fr;
  }
}
</style>
