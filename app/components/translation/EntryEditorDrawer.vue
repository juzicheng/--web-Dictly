<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue";
import type { EntryStatus, TerminalType, TranslationEntry } from "../../types/dictly";

const props = defineProps<{
  open: boolean;
  entryId?: string;
  draftEntry?: TranslationEntry;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const workspace = useWorkspace();
const draft = ref<TranslationEntry | null>(null);
const conflictModalOpen = shallowRef(false);

const statusOptions: Array<{ label: string; value: EntryStatus }> = [
  { label: "草稿", value: "draft" },
  { label: "已翻译", value: "translated" },
  { label: "待审核", value: "reviewing" },
  { label: "已通过", value: "approved" },
  { label: "已过期", value: "outdated" },
  { label: "已下线", value: "deprecated" },
];

const terminalOptions: Array<{ label: string; value: TerminalType }> = [
  { label: "Web", value: "web" },
  { label: "Android", value: "android" },
  { label: "iOS", value: "ios" },
  { label: "后台管理", value: "admin" },
  { label: "文档", value: "docs" },
];

const validations = computed(() => {
  if (!draft.value) {
    return [];
  }

  return workspace.enabledLocales.value
    .filter((locale) => !locale.source)
    .flatMap((locale) =>
      workspace.validateEntry(draft.value!, locale.code).map((item) => ({
        ...item,
        message: `${locale.code}：${item.message}`,
      })),
    );
});
const conflictMessages = computed(() =>
  validations.value.filter((item) => item.type === "error").map((item) => item.message),
);
const duplicateKey = computed(() => {
  if (!draft.value) {
    return false;
  }
  return workspace.currentProject.value?.entries.some(
    (entry) => entry.id !== draft.value?.id && entry.key === draft.value?.key,
  );
});

watch(
  () => [props.open, props.entryId, props.draftEntry, workspace.currentProject.value?.id],
  () => {
    if (!props.open) {
      draft.value = null;
      return;
    }

    if (props.draftEntry) {
      draft.value = JSON.parse(JSON.stringify(props.draftEntry)) as TranslationEntry;
      return;
    }

    if (!props.entryId) {
      draft.value = null;
      return;
    }

    const entry = workspace.currentProject.value?.entries.find((item) => item.id === props.entryId);
    draft.value = entry ? (JSON.parse(JSON.stringify(entry)) as TranslationEntry) : null;
  },
  { immediate: true },
);

watch(conflictMessages, (messages) => {
  if (props.open && messages.length) {
    conflictModalOpen.value = true;
  }
});

function close() {
  emit("close");
}

function save() {
  if (!draft.value || duplicateKey.value) {
    return;
  }

  const sourceCode = workspace.sourceLocale.value;
  draft.value.translations[sourceCode] = draft.value.source;
  workspace.replaceEntry(draft.value);
  emit("saved");
}
</script>

<template>
  <a-drawer
    class="entry-drawer"
    :open="open"
    width="760"
    title="词条编辑"
    :destroy-on-close="true"
    @close="close"
  >
    <template #extra>
      <a-space>
        <a-button @click="close">取消</a-button>
        <a-button type="primary" :disabled="Boolean(duplicateKey)" @click="save">保存</a-button>
      </a-space>
    </template>

    <a-empty v-if="!draft" description="未选择词条" />

    <a-form v-else layout="vertical" class="entry-form">
      <a-alert v-if="duplicateKey" type="error" show-icon message="Key 已存在，请修改为唯一值" />

      <a-row :gutter="12">
        <a-col :xs="24" :md="14">
          <a-form-item label="唯一 Key">
            <a-input v-model:value="draft.key" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="10">
          <a-form-item label="分组">
            <a-input v-model:value="draft.group" placeholder="auth.login" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="源语言文案">
        <a-textarea v-model:value="draft.source" :auto-size="{ minRows: 2, maxRows: 5 }" />
      </a-form-item>

      <a-divider orientation="left">翻译</a-divider>

      <a-row :gutter="12">
        <a-col
          v-for="locale in workspace.enabledLocales.value.filter((item) => !item.source)"
          :key="locale.code"
          :xs="24"
          :md="12"
        >
          <a-form-item :label="`${locale.name} · ${locale.code}`">
            <a-textarea
              v-model:value="draft.translations[locale.code]"
              :auto-size="{ minRows: 2, maxRows: 4 }"
            />
          </a-form-item>
        </a-col>
      </a-row>

      <a-divider orientation="left">状态与元数据</a-divider>

      <a-row :gutter="12">
        <a-col :xs="24" :md="8">
          <a-form-item label="状态">
            <a-select v-model:value="draft.status" :options="statusOptions" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-form-item label="终端类型">
            <a-select v-model:value="draft.meta.terminal" :options="terminalOptions" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="8">
          <a-form-item label="长度限制">
            <a-input-number v-model:value="draft.maxLength" class="full-input" :min="0" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="12">
        <a-col :xs="24" :md="12">
          <a-form-item label="业务模块">
            <a-input v-model:value="draft.meta.businessModule" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="12">
          <a-form-item label="上线版本">
            <a-input v-model:value="draft.meta.release" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="12">
        <a-col :xs="24" :md="12">
          <a-form-item label="标签">
            <a-select v-model:value="draft.tags" mode="tags" placeholder="输入标签后回车" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :md="12">
          <a-form-item label="文案属性">
            <a-space wrap>
              <a-checkbox v-model:checked="draft.meta.industryTerm">行业术语</a-checkbox>
              <a-checkbox v-model:checked="draft.meta.brandLocked">品牌固定文案</a-checkbox>
            </a-space>
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="备注">
        <a-textarea v-model:value="draft.notes" :auto-size="{ minRows: 2, maxRows: 4 }" />
      </a-form-item>

      <a-alert v-if="validations.length" type="warning" show-icon>
        <template #message>
          <div v-for="item in validations" :key="item.message">
            {{ item.message }}
          </div>
        </template>
      </a-alert>
    </a-form>

    <a-modal v-model:open="conflictModalOpen" title="术语冲突提示" ok-text="知道了" :footer="null">
      <a-alert type="error" show-icon>
        <template #message>
          <div v-for="message in conflictMessages" :key="message">
            {{ message }}
          </div>
        </template>
      </a-alert>
    </a-modal>
  </a-drawer>
</template>

<style scoped>
.entry-form {
  display: grid;
  gap: 10px;
}

.entry-form :deep(.ant-form-item) {
  margin-bottom: 12px;
}

.entry-form :deep(.ant-divider) {
  margin: 6px 0 12px;
  color: var(--dt-muted);
  font-size: 0.82rem;
  font-weight: 750;
}

.entry-form :deep(.ant-alert) {
  margin-bottom: 8px;
}

.full-input {
  width: 100%;
}

.entry-drawer :deep(.ant-drawer-header) {
  border-bottom-color: var(--dt-border);
}

.entry-drawer :deep(.ant-drawer-title) {
  color: var(--dt-text);
  font-weight: 800;
}
</style>
