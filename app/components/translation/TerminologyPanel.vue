<script setup lang="ts">
import { computed, reactive } from "vue";
import type { TableColumnsType } from "ant-design-vue";
import type { GlossaryTerm, TermType } from "../../types/dictly";

const workspace = useWorkspace();

const columns: TableColumnsType<GlossaryTerm> = [
  { title: "源术语", key: "source", width: 180 },
  { title: "类型", key: "type", width: 120 },
  { title: "标准译法", key: "target" },
  { title: "说明", dataIndex: "description", key: "description" },
  { title: "操作", key: "actions", width: 100 },
];

const termForm = reactive({
  source: "",
  target: "",
  type: "standard" as TermType,
  description: "",
});

const typeOptions = [
  { label: "标准术语", value: "standard" },
  { label: "禁用术语", value: "forbidden" },
];

const currentLocaleName = computed(
  () =>
    workspace.enabledLocales.value.find((locale) => locale.code === workspace.filters.value.locale)
      ?.name,
);
const termCount = computed(() => workspace.currentProject.value?.glossary.length ?? 0);
const forbiddenCount = computed(
  () =>
    workspace.currentProject.value?.glossary.filter((term) => term.type === "forbidden").length ??
    0,
);

function submit() {
  workspace.addTerm({
    source: termForm.source,
    target: { [workspace.filters.value.locale]: termForm.target },
    type: termForm.type,
    description: termForm.description,
  });
  termForm.source = "";
  termForm.target = "";
  termForm.type = "standard";
  termForm.description = "";
}
</script>

<template>
  <section class="section-band panel-stack">
    <div class="panel-header">
      <h2 class="section-title">术语库</h2>
      <div class="panel-stats">
        <span>{{ termCount }} 术语</span>
        <span>{{ forbiddenCount }} 禁用</span>
        <span>{{ currentLocaleName }} · {{ workspace.filters.value.locale }}</span>
      </div>
    </div>

    <div class="form-strip">
      <a-form class="term-form" layout="inline" :model="termForm" @finish="submit">
        <a-form-item name="source" :rules="[{ required: true, message: '请输入源术语' }]">
          <a-input v-model:value="termForm.source" placeholder="源术语" />
        </a-form-item>
        <a-form-item>
          <a-input v-model:value="termForm.target" placeholder="当前语种译法" />
        </a-form-item>
        <a-form-item>
          <a-select v-model:value="termForm.type" class="type-select" :options="typeOptions" />
        </a-form-item>
        <a-form-item>
          <a-input v-model:value="termForm.description" placeholder="说明" />
        </a-form-item>
        <a-button type="primary" html-type="submit">新增术语</a-button>
      </a-form>
    </div>

    <a-table
      row-key="id"
      size="middle"
      :columns="columns"
      :data-source="workspace.currentProject.value?.glossary ?? []"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'source'">
          <a-typography-text strong>{{ record.source }}</a-typography-text>
        </template>
        <template v-else-if="column.key === 'type'">
          <a-tag :color="record.type === 'standard' ? 'green' : 'error'">
            {{ record.type === "standard" ? "标准" : "禁用" }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'target'">
          <a-space wrap>
            <a-tag v-for="[locale, value] in Object.entries(record.target)" :key="locale">
              {{ locale }}: {{ value }}
            </a-tag>
          </a-space>
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-popconfirm
            title="删除该术语？"
            ok-text="删除"
            cancel-text="取消"
            @confirm="workspace.removeTerm(record.id)"
          >
            <a-button danger size="small">删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>
  </section>
</template>

<style scoped>
.panel-stack {
  display: grid;
  gap: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.panel-stats span {
  padding: 5px 10px;
  color: var(--dt-muted);
  background: var(--dt-surface-soft);
  border: 1px solid var(--dt-border);
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 750;
}

.form-strip {
  padding: 12px;
  background: var(--dt-surface-soft);
  border: 1px solid var(--dt-border);
  border-radius: var(--dt-radius);
}

.term-form {
  gap: 8px;
}

.type-select {
  width: 120px;
}

@media (max-width: 48em) {
  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
