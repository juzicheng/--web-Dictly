<script setup lang="ts">
import { computed, reactive } from "vue";
import type { TableColumnsType } from "ant-design-vue";
import type { LocaleConfig } from "../../types/dictly";

const workspace = useWorkspace();
const enabledCount = computed(
  () => workspace.currentProject.value?.locales.filter((locale) => locale.enabled).length ?? 0,
);
const sourceLocale = computed(
  () => workspace.currentProject.value?.locales.find((locale) => locale.source),
);

const columns: TableColumnsType<LocaleConfig> = [
  { title: "语种", key: "locale" },
  { title: "状态", key: "enabled", width: 140 },
  { title: "源语言", key: "source", width: 140 },
];

const form = reactive({
  code: "",
  name: "",
});

function submit() {
  workspace.addLocale(form.code, form.name);
  form.code = "";
  form.name = "";
}
</script>

<template>
  <section class="section-band panel-stack">
    <div class="panel-header">
      <h2 class="section-title">语种配置</h2>
      <div class="panel-stats">
        <span>{{ enabledCount }} 启用</span>
        <span>源语言 {{ sourceLocale?.code }}</span>
      </div>
    </div>

    <div class="form-strip">
      <a-form class="locale-form" layout="inline" :model="form" @finish="submit">
        <a-form-item name="code" :rules="[{ required: true, message: '请输入语种代码' }]">
          <a-input v-model:value="form.code" placeholder="例如 ko-KR" />
        </a-form-item>
        <a-form-item name="name" :rules="[{ required: true, message: '请输入语种名称' }]">
          <a-input v-model:value="form.name" placeholder="例如 한국어" />
        </a-form-item>
        <a-button type="primary" html-type="submit">新增语种</a-button>
      </a-form>
    </div>

    <a-table
      row-key="code"
      size="middle"
      :columns="columns"
      :data-source="workspace.currentProject.value?.locales ?? []"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'locale'">
          <a-space direction="vertical" :size="2">
            <a-typography-text strong>{{ record.name }}</a-typography-text>
            <span class="muted">{{ record.code }}</span>
          </a-space>
        </template>
        <template v-else-if="column.key === 'enabled'">
          <a-switch
            :checked="record.enabled"
            :disabled="record.source"
            checked-children="启用"
            un-checked-children="禁用"
            @update:checked="
              (value: unknown) => workspace.updateLocale(record.code, { enabled: Boolean(value) })
            "
          />
        </template>
        <template v-else-if="column.key === 'source'">
          <a-radio
            :checked="record.source"
            @change="workspace.updateLocale(record.code, { source: true })"
          >
            源语言
          </a-radio>
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

.locale-form {
  gap: 8px;
}

@media (max-width: 48em) {
  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
