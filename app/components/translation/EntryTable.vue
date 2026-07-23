<script setup lang="ts">
import { computed } from "vue";
import type { TableColumnsType } from "ant-design-vue";
import type { EntryValidation, TranslationEntry } from "../../types/dictly";
import {
  DeleteOutlined,
  EditOutlined,
  RobotOutlined,
  WarningOutlined,
} from "@ant-design/icons-vue";

const emit = defineEmits<{
  edit: [entryId: string];
}>();

const workspace = useWorkspace();

const targetLocales = computed(() =>
  workspace.enabledLocales.value.filter((locale) => !locale.source),
);

const columns = computed<TableColumnsType<TranslationEntry>>(() => [
  { title: "Key / 分组", key: "identity", width: 260, fixed: "left" },
  { title: "源文案", key: "source", width: 280 },
  ...targetLocales.value.map((locale) => ({
    title: `${locale.name} · ${locale.code}`,
    key: `translation:${locale.code}`,
    width: 280,
  })),
  { title: "元数据", key: "meta", width: 260 },
  { title: "校验", key: "validation", width: 120 },
  { title: "操作", key: "actions", width: 170, fixed: "right" },
]);

const tableScrollX = computed(() => 1090 + targetLocales.value.length * 280);

const rowSelection = computed(() => ({
  selectedRowKeys: workspace.selectedEntryIds.value,
  preserveSelectedRowKeys: true,
  onChange: (keys: Array<string | number>) => workspace.setSelectedEntryIds(keys.map(String)),
}));

function localeFromTranslationColumn(key: unknown) {
  const value = String(key);
  return value.startsWith("translation:") ? value.slice("translation:".length) : "";
}

function validationMessages(record: TranslationEntry) {
  return targetLocales.value.flatMap((locale) =>
    workspace.validateEntry(record, locale.code).map(
      (item): EntryValidation => ({
        ...item,
        message: `${locale.code}：${item.message}`,
      }),
    ),
  );
}
</script>

<template>
  <a-table
    class="entry-table"
    size="middle"
    row-key="id"
    :columns="columns"
    :data-source="workspace.filteredEntries.value"
    :pagination="{ pageSize: 8, showSizeChanger: true }"
    :row-selection="rowSelection"
    :scroll="{ x: tableScrollX }"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'identity'">
        <a-space direction="vertical" :size="4">
          <a-typography-text strong copyable>
            {{ record.key }}
          </a-typography-text>
          <a-tag>{{ record.group }}</a-tag>
          <a-space wrap :size="[4, 4]">
            <a-tag v-for="tag in record.tags" :key="tag" color="blue">
              {{ tag }}
            </a-tag>
          </a-space>
        </a-space>
      </template>

      <template v-else-if="column.key === 'source'">
        <a-typography-paragraph class="cell-paragraph">
          {{ record.source || "未填写源文案" }}
        </a-typography-paragraph>
        <span class="muted">{{ record.notes }}</span>
      </template>

      <template v-else-if="localeFromTranslationColumn(column.key)">
        <a-typography-paragraph
          v-if="record.translations[localeFromTranslationColumn(column.key)]"
          class="translation-text"
        >
          {{ record.translations[localeFromTranslationColumn(column.key)] }}
        </a-typography-paragraph>
        <span v-else class="empty-translation">未填写</span>
        <div class="translation-meta">
          <span>{{ localeFromTranslationColumn(column.key) }}</span>
          <span v-if="record.maxLength">
            {{ (record.translations[localeFromTranslationColumn(column.key)] || "").length }}/{{
              record.maxLength
            }}
          </span>
        </div>
      </template>

      <template v-else-if="column.key === 'meta'">
        <a-space direction="vertical" :size="4">
          <span>{{ record.meta.businessModule }} · {{ record.meta.terminal }}</span>
          <span class="muted">{{ record.meta.release }}</span>
          <a-space wrap :size="[4, 4]">
            <a-tag v-if="record.meta.industryTerm" color="purple">行业术语</a-tag>
            <a-tag v-if="record.meta.brandLocked" color="green">品牌固定</a-tag>
          </a-space>
        </a-space>
      </template>

      <template v-else-if="column.key === 'validation'">
        <a-tooltip v-if="validationMessages(record).length">
          <template #title>
            <div v-for="item in validationMessages(record)" :key="item.message">
              {{ item.message }}
            </div>
          </template>
          <a-badge :count="validationMessages(record).length">
            <WarningOutlined class="warning-icon" />
          </a-badge>
        </a-tooltip>
        <a-tag v-else color="success">通过</a-tag>
      </template>

      <template v-else-if="column.key === 'actions'">
        <a-space>
          <a-tooltip title="编辑">
            <a-button size="small" @click="emit('edit', record.id)">
              <template #icon>
                <EditOutlined />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip title="填充全语种">
            <a-button
              size="small"
              :loading="workspace.machineBusy.value"
              @click="workspace.autoTranslateEntry(record.id)"
            >
              <template #icon>
                <RobotOutlined />
              </template>
            </a-button>
          </a-tooltip>
          <a-popconfirm
            title="确定删除该词条？"
            ok-text="删除"
            cancel-text="取消"
            @confirm="workspace.deleteEntries([record.id])"
          >
            <a-button danger size="small">
              <template #icon>
                <DeleteOutlined />
              </template>
            </a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </template>
  </a-table>
</template>

<style scoped>
.entry-table {
  overflow: hidden;
  border: 1px solid #d8dee4;
  border-radius: 8px;
  background: #ffffff;
}

.cell-paragraph {
  max-width: 250px;
  margin-bottom: 4px;
}

.translation-text {
  max-width: 250px;
  margin-bottom: 4px;
  white-space: pre-wrap;
}

.translation-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  color: #6e7781;
  font-size: 12px;
}

.empty-translation {
  color: #8c959f;
}

.warning-icon {
  color: #bf8700;
  font-size: 20px;
}
</style>
