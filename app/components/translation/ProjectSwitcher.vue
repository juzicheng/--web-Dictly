<script setup lang="ts">
import { computed } from "vue";
import type { SelectValue } from "ant-design-vue/es/select";

const workspace = useWorkspace();

const currentProject = computed(() => workspace.currentProject.value);
const targetLocales = computed(
  () => currentProject.value?.locales.filter((locale) => locale.enabled && !locale.source) ?? [],
);
const translatedSlots = computed(() => {
  const project = currentProject.value;
  if (!project) {
    return 0;
  }

  return project.entries.reduce(
    (sum, entry) =>
      sum + targetLocales.value.filter((locale) => entry.translations[locale.code]?.trim()).length,
    0,
  );
});
const totalSlots = computed(
  () => (currentProject.value?.entries.length ?? 0) * targetLocales.value.length,
);
const completion = computed(() =>
  totalSlots.value ? Math.round((translatedSlots.value / totalSlots.value) * 100) : 0,
);
const pendingCount = computed(
  () =>
    currentProject.value?.entries.filter((entry) =>
      ["draft", "reviewing", "outdated"].includes(entry.status),
    ).length ?? 0,
);
const dotCount = 42;

function handleProjectChange(value: SelectValue) {
  if (typeof value === "string" || typeof value === "number") {
    workspace.setProject(String(value));
  }
}
</script>

<template>
  <section class="section-band project-switcher">
    <div class="project-summary">
      <a-space wrap :size="[6, 6]">
        <a-tag color="blue">{{ currentProject?.teamName }}</a-tag>
        <a-tag>{{ currentProject?.entries.length }} 词条</a-tag>
        <a-tag>{{ workspace.enabledLocales.value.length }} 启用语种</a-tag>
      </a-space>

      <h1 class="section-title">{{ currentProject?.name }}</h1>
      <p class="muted">{{ currentProject?.description }}</p>

      <div class="module-list">
        <a-tag v-for="module in currentProject?.modules" :key="module">
          {{ module }}
        </a-tag>
      </div>
    </div>

    <div class="project-health">
      <div class="health-score">
        <span>交付完整度</span>
        <strong>{{ completion }}%</strong>
      </div>
      <div class="dot-board" aria-hidden="true">
        <span
          v-for="index in dotCount"
          :key="index"
          :class="{ active: index <= Math.round((dotCount * completion) / 100) }"
        />
      </div>
      <div class="health-meta">
        <span>{{ translatedSlots }}/{{ totalSlots }} 译文</span>
        <span>{{ pendingCount }} 待处理</span>
      </div>
      <a-select
        id="dictly-project-select"
        class="project-select"
        :value="currentProject?.id"
        size="large"
        @update:value="handleProjectChange"
      >
        <a-select-option
          v-for="project in workspace.projects.value"
          :key="project.id"
          :value="project.id"
        >
          {{ project.teamName }} / {{ project.name }}
        </a-select-option>
      </a-select>
    </div>
  </section>
</template>

<style scoped>
.project-switcher {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(310px, 380px);
  gap: 20px;
  align-items: stretch;
}

.project-summary {
  display: grid;
  align-content: center;
  gap: 10px;
  min-width: 0;
}

.project-summary .section-title {
  font-size: 1.55rem;
}

.project-summary .muted {
  max-width: 780px;
  margin: 0;
  line-height: 1.65;
}

.module-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.project-health {
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  background: var(--dt-surface-soft);
  border: 1px solid var(--dt-border);
  border-radius: var(--dt-radius);
}

.health-score,
.health-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.health-score span,
.health-meta {
  color: var(--dt-muted);
  font-size: 0.8rem;
  font-weight: 650;
}

.health-score strong {
  color: var(--dt-green);
  font-size: 1.65rem;
  line-height: 1;
  letter-spacing: 0;
}

.dot-board {
  display: grid;
  grid-template-columns: repeat(14, 1fr);
  gap: 5px;
}

.dot-board span {
  aspect-ratio: 1;
  min-width: 5px;
  background: #e2e0e8;
  border-radius: 50%;
}

.dot-board span.active {
  background: linear-gradient(135deg, var(--dt-green), var(--dt-yellow));
}

.project-select {
  width: 100%;
}

@media (max-width: 62em) {
  .project-switcher {
    grid-template-columns: 1fr;
  }
}
</style>
