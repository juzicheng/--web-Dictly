<script setup lang="ts">
const workspace = useWorkspace();

function handleProjectChange(value: string) {
  workspace.setProject(value);
}
</script>

<template>
  <section class="section-band project-switcher">
    <div class="project-summary">
      <a-space wrap>
        <a-tag color="blue">{{ workspace.currentProject.value?.teamName }}</a-tag>
        <a-tag>{{ workspace.currentProject.value?.entries.length }} 词条</a-tag>
        <a-tag>{{ workspace.enabledLocales.value.length }} 启用语种</a-tag>
      </a-space>
      <h1 class="section-title">{{ workspace.currentProject.value?.name }}</h1>
      <p class="muted">{{ workspace.currentProject.value?.description }}</p>
      <div class="module-list">
        <a-tag v-for="module in workspace.currentProject.value?.modules" :key="module">
          {{ module }}
        </a-tag>
      </div>
    </div>

    <a-select
      class="project-select"
      :value="workspace.currentProject.value?.id"
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
  </section>
</template>

<style scoped>
.project-switcher {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.project-summary {
  min-width: 0;
}

.project-summary .section-title {
  margin-top: 10px;
}

.project-summary .muted {
  margin: 8px 0 0;
}

.module-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.project-select {
  width: min(360px, 100%);
}

@media (max-width: 760px) {
  .project-switcher {
    flex-direction: column;
  }

  .project-select {
    width: 100%;
  }
}
</style>
