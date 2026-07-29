<script setup lang="ts">
import { shallowRef, watch } from "vue";
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
const route = useRoute();
const router = useRouter();

type WorkspaceTabKey = "entries" | "languages" | "assets" | "terms" | "collaboration";

const workspaceTabs = new Set<WorkspaceTabKey>([
  "entries",
  "languages",
  "assets",
  "terms",
  "collaboration",
]);

function normalizeWorkspaceTab(tab: unknown): WorkspaceTabKey {
  const value = Array.isArray(tab) ? tab[0] : tab;

  return typeof value === "string" && workspaceTabs.has(value as WorkspaceTabKey)
    ? (value as WorkspaceTabKey)
    : "entries";
}

const activeTab = shallowRef<WorkspaceTabKey>(normalizeWorkspaceTab(route.query.tab));
const drawerOpen = shallowRef(false);
const editingEntryId = shallowRef<string | undefined>();
const creatingEntryDraft = shallowRef<TranslationEntry | undefined>();

watch(
  () => route.query.tab,
  (tab) => {
    const nextTab = normalizeWorkspaceTab(tab);
    if (activeTab.value !== nextTab) {
      activeTab.value = nextTab;
    }
  },
);

watch(activeTab, (tab) => {
  if (normalizeWorkspaceTab(route.query.tab) === tab) {
    return;
  }

  const query = { ...route.query };
  if (tab === "entries") {
    delete query.tab;
  } else {
    query.tab = tab;
  }

  void router.replace({ path: route.path, query });
});

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
  <div class="page-stack workspace-page">
    <ProjectSwitcher />
    <WorkspaceToolbar @create-entry="createEntry" @open-import-export="openImportExport" />

    <section class="workspace-stage">
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
    </section>

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
.workspace-page {
  gap: 12px;
}

.workspace-stage {
  min-width: 0;
}

.workspace-tabs {
  min-width: 0;
  padding: 0 0 8px;
}

.workspace-tabs :deep(.ant-tabs-nav) {
  margin: 0 0 12px;
  padding: 0 4px;
}

.tab-stack {
  display: grid;
  gap: 12px;
}

@media (max-width: 48em) {
  .workspace-tabs :deep(.ant-tabs-nav-wrap) {
    overflow: auto;
  }
}
</style>
