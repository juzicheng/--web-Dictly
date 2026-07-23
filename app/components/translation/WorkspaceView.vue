<script setup lang="ts">
import { shallowRef } from "vue";
import type { TranslationEntry } from "../../types/dictly";
import BatchActionBar from "./BatchActionBar.vue";
import CollaborationPanel from "./CollaborationPanel.vue";
import EntryEditorDrawer from "./EntryEditorDrawer.vue";
import EntryTable from "./EntryTable.vue";
import ImportExportPanel from "./ImportExportPanel.vue";
import LanguageSettings from "./LanguageSettings.vue";
import ProjectSwitcher from "./ProjectSwitcher.vue";
import TerminologyPanel from "./TerminologyPanel.vue";
import WorkspaceToolbar from "./WorkspaceToolbar.vue";

const workspace = useWorkspace();
const activeTab = shallowRef("entries");
const drawerOpen = shallowRef(false);
const editingEntryId = shallowRef<string | undefined>();
const creatingEntryDraft = shallowRef<TranslationEntry | undefined>();

function createEntry() {
  const entry = workspace.createEntryDraft();
  if (!entry) {
    return;
  }
  editingEntryId.value = undefined;
  creatingEntryDraft.value = entry;
  drawerOpen.value = true;
}

function editEntry(entryId: string) {
  editingEntryId.value = entryId;
  creatingEntryDraft.value = undefined;
  drawerOpen.value = true;
}

function closeDrawer() {
  drawerOpen.value = false;
  editingEntryId.value = undefined;
  creatingEntryDraft.value = undefined;
}

function saveDrawer() {
  drawerOpen.value = false;
  editingEntryId.value = undefined;
  creatingEntryDraft.value = undefined;
}

function openImportExport() {
  activeTab.value = "assets";
}
</script>

<template>
  <div class="page-stack">
    <ProjectSwitcher />
    <WorkspaceToolbar @create-entry="createEntry" @open-import-export="openImportExport" />

    <a-tabs v-model:active-key="activeTab" class="workspace-tabs">
      <a-tab-pane key="entries" tab="词条工作台">
        <div class="tab-stack">
          <BatchActionBar />
          <EntryTable @edit="editEntry" />
        </div>
      </a-tab-pane>

      <a-tab-pane key="languages" tab="语种配置">
        <LanguageSettings />
      </a-tab-pane>

      <a-tab-pane key="assets" tab="导入导出">
        <ImportExportPanel />
      </a-tab-pane>

      <a-tab-pane key="terms" tab="术语库">
        <TerminologyPanel />
      </a-tab-pane>

      <a-tab-pane key="collaboration" tab="成员与审计">
        <CollaborationPanel />
      </a-tab-pane>
    </a-tabs>

    <EntryEditorDrawer
      :open="drawerOpen"
      :entry-id="editingEntryId"
      :draft-entry="creatingEntryDraft"
      @close="closeDrawer"
      @saved="saveDrawer"
    />
  </div>
</template>

<style scoped>
.workspace-tabs {
  padding: 0 0 12px;
}

.workspace-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 12px;
}

.tab-stack {
  display: grid;
  gap: 12px;
}
</style>
