import { computed, onMounted, readonly, shallowRef, watch } from "vue";
import { createMockProjects } from "../data/mockWorkspace";
import type {
  DictlyProject,
  EntryStatus,
  EntryValidation,
  ExportFormat,
  GlossaryTerm,
  ImportTask,
  ImportFormat,
  LocaleCode,
  LocaleConfig,
  MachineProvider,
  ProjectMember,
  TranslationEntry,
  UserRole,
  WorkspaceFilters,
} from "../types/dictly";
import { parseImportedEntries, serializeEntries } from "../utils/importExport";

interface WorkspaceState {
  projects: DictlyProject[];
  currentProjectId: string;
  filters: WorkspaceFilters;
  selectedEntryIds: string[];
  machineProvider: MachineProvider;
}

interface AutoTranslateOptions {
  ids?: string[];
  locales?: LocaleCode[];
  overwrite?: boolean;
}

export interface AutoTranslateResult {
  changedCount: number;
  requestedCount: number;
  skippedCount: number;
  locales: LocaleCode[];
}

const storageKey = "dictly-workspace-state";

const statusRank: Record<EntryStatus, number> = {
  draft: 1,
  translated: 2,
  reviewing: 3,
  approved: 4,
  outdated: 5,
  deprecated: 6,
};

const providerNames: Record<MachineProvider, string> = {
  mymemory: "MyMemory",
  local: "本地模拟",
};

const terminalLengthHints = {
  web: 80,
  android: 40,
  ios: 40,
  admin: 60,
  docs: 120,
};

function createDefaultFilters(): WorkspaceFilters {
  return {
    query: "",
    locale: "en-US",
    status: "all",
    group: "all",
    onlyUntranslated: false,
    onlyReviewing: false,
    onlyOutdated: false,
  };
}

function createInitialState(): WorkspaceState {
  const projects = createMockProjects();
  return {
    projects,
    currentProjectId: projects[0]?.id ?? "",
    filters: createDefaultFilters(),
    selectedEntryIds: [],
    machineProvider: "mymemory",
  };
}

function mergeMissingMockProjects(state: WorkspaceState): WorkspaceState {
  const existingProjectIds = new Set(state.projects.map((project) => project.id));
  const missingProjects = createMockProjects().filter(
    (project) => !existingProjectIds.has(project.id),
  );

  if (!missingProjects.length) {
    return state;
  }

  return {
    ...state,
    projects: [...state.projects, ...missingProjects],
  };
}

function nowIso() {
  return new Date().toISOString();
}

function cloneEntry(entry: TranslationEntry): TranslationEntry {
  return JSON.parse(JSON.stringify(entry)) as TranslationEntry;
}

function cloneProject(project: DictlyProject): DictlyProject {
  return JSON.parse(JSON.stringify(project)) as DictlyProject;
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function groupFromKey(key: string) {
  return key.split(".").slice(0, -1).join(".") || "common";
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function randomKey(existing: Set<string>) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let key = "";

  do {
    key = Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
      "",
    );
  } while (existing.has(key));

  return key;
}

function copyProjectName(name: string, existingNames: Set<string>) {
  const baseName = `${name} 副本`;
  if (!existingNames.has(baseName)) {
    return baseName;
  }

  let index = 2;
  let nextName = `${baseName} ${index}`;
  while (existingNames.has(nextName)) {
    index += 1;
    nextName = `${baseName} ${index}`;
  }

  return nextName;
}

function inferStatus(entry: TranslationEntry, sourceLocale: LocaleCode) {
  const targetLocales = Object.keys(entry.translations).filter((locale) => locale !== sourceLocale);
  const translatedCount = targetLocales.filter((locale) =>
    entry.translations[locale]?.trim(),
  ).length;

  if (entry.status === "deprecated" || entry.status === "outdated") {
    return entry.status;
  }

  if (translatedCount === 0) {
    return "draft";
  }

  if (translatedCount < targetLocales.length) {
    return "translated";
  }

  return entry.status === "approved" ? "approved" : "reviewing";
}

function applyTermMap(text: string, locale: LocaleCode, glossary: GlossaryTerm[]) {
  return glossary.reduce((result, term) => {
    if (term.type !== "standard") {
      return result;
    }
    const target = term.target[locale];
    if (!target) {
      return result;
    }
    return result.replaceAll(term.source, target);
  }, text);
}

function pseudoTranslate(text: string, locale: LocaleCode, glossary: GlossaryTerm[]) {
  const dictionary: Record<string, Partial<Record<LocaleCode, string>>> = {
    登录: {
      "en-US": "sign in",
      "ja-JP": "ログイン",
      "es-ES": "iniciar sesión",
      "fr-FR": "connexion",
    },
    账户: { "en-US": "account", "ja-JP": "アカウント", "es-ES": "cuenta", "fr-FR": "compte" },
    订单: { "en-US": "order", "ja-JP": "注文", "es-ES": "pedido", "fr-FR": "commande" },
    支付: { "en-US": "payment", "ja-JP": "支払い", "es-ES": "pago", "fr-FR": "paiement" },
    快速开始: {
      "en-US": "Getting started",
      "ja-JP": "はじめに",
      "es-ES": "Primeros pasos",
      "fr-FR": "Bien demarrer",
    },
  };

  let result = applyTermMap(text, locale, glossary);
  for (const [source, targets] of Object.entries(dictionary)) {
    const translated = targets[locale];
    if (translated) {
      result = result.replaceAll(source, translated);
    }
  }

  if (result === text) {
    result = `[${locale}] ${text}`;
  }

  return result;
}

async function requestMachineTranslation(
  text: string,
  sourceLocale: LocaleCode,
  targetLocale: LocaleCode,
  provider: MachineProvider,
  glossary: GlossaryTerm[],
) {
  if (!text.trim() || provider === "local") {
    return pseudoTranslate(text, targetLocale, glossary);
  }

  try {
    const response = await $fetch<{ translatedText: string; provider: string }>(
      "/api/translation/translate",
      {
        method: "POST",
        body: {
          text,
          sourceLocale,
          targetLocale,
          provider,
        },
      },
    );

    return response.translatedText || pseudoTranslate(text, targetLocale, glossary);
  } catch {
    return pseudoTranslate(text, targetLocale, glossary);
  }
}

async function translateEntryLocale(
  entry: TranslationEntry,
  locale: LocaleCode,
  project: DictlyProject,
  sourceLocale: LocaleCode,
  provider: MachineProvider,
  overwrite: boolean,
) {
  if (!entry.source.trim()) {
    return false;
  }

  if (!overwrite && entry.translations[locale]?.trim()) {
    return false;
  }

  entry.translations[locale] = await requestMachineTranslation(
    entry.source,
    sourceLocale,
    locale,
    provider,
    project.glossary,
  );
  entry.status = inferStatus(entry, sourceLocale);
  entry.updatedAt = nowIso();
  entry.updatedBy = "当前用户";
  return true;
}

function downloadText(filename: string, content: string) {
  if (!import.meta.client) {
    return;
  }

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function useWorkspace() {
  const state = useState<WorkspaceState>("dictly-workspace", createInitialState);
  const attached = useState<boolean>("dictly-workspace-persistence", () => false);
  const importBusy = shallowRef(false);
  const machineBusy = shallowRef(false);

  if (import.meta.client && !attached.value) {
    attached.value = true;

    onMounted(() => {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }

      try {
        const parsed = JSON.parse(raw) as WorkspaceState;
        parsed.filters = {
          ...createDefaultFilters(),
          ...parsed.filters,
          status: "all",
          onlyReviewing: false,
          onlyOutdated: false,
        };
        if (!["mymemory", "local"].includes(parsed.machineProvider)) {
          parsed.machineProvider = "mymemory";
        }
        state.value = mergeMissingMockProjects(parsed);
      } catch {
        localStorage.removeItem(storageKey);
      }
    });

    watch(
      state,
      (value) => {
        localStorage.setItem(storageKey, JSON.stringify(value));
      },
      { deep: true },
    );
  }

  const projects = computed(() => state.value.projects);
  const currentProject = computed(
    () =>
      projects.value.find((project) => project.id === state.value.currentProjectId) ??
      projects.value[0],
  );
  const sourceLocale = computed(
    () => currentProject.value?.locales.find((locale) => locale.source)?.code ?? "zh-CN",
  );
  const enabledLocales = computed(
    () => currentProject.value?.locales.filter((locale) => locale.enabled) ?? [],
  );
  const groups = computed(() =>
    Array.from(new Set(currentProject.value?.entries.map((entry) => entry.group) ?? [])).sort(),
  );
  const filters = computed(() => state.value.filters);
  const selectedEntryIds = computed(() => state.value.selectedEntryIds);
  const machineProvider = computed(() => state.value.machineProvider);

  const filteredEntries = computed(() => {
    const project = currentProject.value;
    if (!project) {
      return [];
    }

    const query = normalize(state.value.filters.query);
    const targetLocaleCodes = project.locales
      .filter((locale) => locale.enabled && !locale.source)
      .map((locale) => locale.code);

    return project.entries
      .filter((entry) => {
        const searchable = [
          entry.key,
          entry.group,
          entry.source,
          entry.notes,
          entry.meta.businessModule,
          entry.meta.release,
          ...entry.tags,
          ...Object.values(entry.translations),
        ]
          .join(" ")
          .toLowerCase();

        if (query && !searchable.includes(query)) {
          return false;
        }

        if (state.value.filters.status !== "all" && entry.status !== state.value.filters.status) {
          return false;
        }

        if (state.value.filters.group !== "all" && entry.group !== state.value.filters.group) {
          return false;
        }

        const hasUntranslatedTarget = targetLocaleCodes.some(
          (locale) => !entry.translations[locale]?.trim(),
        );
        if (state.value.filters.onlyUntranslated && !hasUntranslatedTarget) {
          return false;
        }

        if (state.value.filters.onlyReviewing && entry.status !== "reviewing") {
          return false;
        }

        if (state.value.filters.onlyOutdated && entry.status !== "outdated") {
          return false;
        }

        return true;
      })
      .sort(
        (left, right) =>
          statusRank[left.status] - statusRank[right.status] || left.key.localeCompare(right.key),
      );
  });

  const dashboardStats = computed(() => {
    const entries = projects.value.flatMap((project) => project.entries);
    const localeCount = projects.value.reduce(
      (sum, project) => sum + project.locales.filter((locale) => locale.enabled).length,
      0,
    );
    const pendingCount = entries.filter((entry) =>
      ["draft", "reviewing", "outdated"].includes(entry.status),
    ).length;
    const approvedCount = entries.filter((entry) => entry.status === "approved").length;

    return {
      projectCount: projects.value.length,
      entryCount: entries.length,
      localeCount,
      pendingCount,
      approvedCount,
    };
  });

  function addActivity(action: string, target: string, actor = "当前用户") {
    const project = currentProject.value;
    if (!project) {
      return;
    }

    project.activities.unshift({
      id: createId("activity"),
      actor,
      action,
      target,
      at: nowIso(),
    });
  }

  function setProject(projectId: string) {
    state.value.currentProjectId = projectId;
    state.value.selectedEntryIds = [];
    const project = projects.value.find((item) => item.id === projectId);
    const currentLocale = state.value.filters.locale;
    if (
      project &&
      !project.locales.some((locale) => locale.code === currentLocale && locale.enabled)
    ) {
      state.value.filters.locale =
        project.locales.find((locale) => locale.enabled && !locale.source)?.code ??
        project.locales[0]?.code ??
        "zh-CN";
    }
  }

  function setFilter<K extends keyof WorkspaceFilters>(key: K, value: WorkspaceFilters[K]) {
    state.value.filters[key] = value;
  }

  function resetFilters() {
    state.value.filters = {
      ...createDefaultFilters(),
      locale: state.value.filters.locale,
    };
    state.value.selectedEntryIds = [];
  }

  function setSelectedEntryIds(ids: string[]) {
    state.value.selectedEntryIds = ids;
  }

  function setMachineProvider(provider: MachineProvider) {
    state.value.machineProvider = provider;
  }

  function duplicateProject(projectId: string) {
    const source = projects.value.find((project) => project.id === projectId);
    if (!source) {
      return undefined;
    }

    const timestamp = nowIso();
    const copied = cloneProject(source);
    copied.id = createId("project");
    copied.name = copyProjectName(
      source.name,
      new Set(state.value.projects.map((project) => project.name)),
    );
    copied.entries = copied.entries.map((entry) => ({
      ...entry,
      id: createId("entry"),
      createdAt: timestamp,
      updatedAt: timestamp,
      updatedBy: "当前用户",
    }));
    copied.glossary = copied.glossary.map((term) => ({ ...term, id: createId("term") }));
    copied.members = copied.members.map((member) => ({ ...member, id: createId("member") }));
    copied.importTasks = copied.importTasks.map((task) => ({ ...task, id: createId("task") }));
    copied.exportTargets = copied.exportTargets.map((target) => ({
      ...target,
      id: createId("export"),
      updatedAt: timestamp,
    }));
    copied.activities = [
      {
        id: createId("activity"),
        actor: "当前用户",
        action: "创建副本",
        target: source.name,
        at: timestamp,
      },
      ...copied.activities.map((activity) => ({ ...activity, id: createId("activity") })),
    ];

    const sourceIndex = state.value.projects.findIndex((project) => project.id === projectId);
    state.value.projects.splice(sourceIndex + 1, 0, copied);
    state.value.currentProjectId = copied.id;
    state.value.selectedEntryIds = [];
    return copied;
  }

  function updateProject(
    projectId: string,
    patch: Partial<Pick<DictlyProject, "name" | "teamName" | "description" | "modules">>,
  ) {
    const project = projects.value.find((item) => item.id === projectId);
    if (!project) {
      return false;
    }

    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (name) {
        project.name = name;
      }
    }
    if (patch.teamName !== undefined) {
      const teamName = patch.teamName.trim();
      if (teamName) {
        project.teamName = teamName;
      }
    }
    if (patch.description !== undefined) {
      project.description = patch.description.trim();
    }
    if (patch.modules !== undefined) {
      project.modules = patch.modules.map((module) => module.trim()).filter(Boolean);
    }

    project.activities.unshift({
      id: createId("activity"),
      actor: "当前用户",
      action: "编辑项目",
      target: project.name,
      at: nowIso(),
    });

    return true;
  }

  function deleteProject(projectId: string) {
    const project = projects.value.find((item) => item.id === projectId);
    if (!project) {
      return false;
    }

    state.value.projects = state.value.projects.filter((item) => item.id !== projectId);
    if (state.value.currentProjectId === projectId) {
      state.value.currentProjectId = state.value.projects[0]?.id ?? "";
      state.value.selectedEntryIds = [];
    }

    return true;
  }

  function createEntryDraft() {
    const project = currentProject.value;
    if (!project) {
      return undefined;
    }

    const existing = new Set(project.entries.map((entry) => entry.key));
    const key = randomKey(existing);
    const translations = Object.fromEntries(project.locales.map((locale) => [locale.code, ""]));
    const created: TranslationEntry = {
      id: createId("entry"),
      key,
      group: "common",
      source: "",
      translations,
      status: "draft",
      tags: [],
      notes: "",
      maxLength: terminalLengthHints.web,
      meta: {
        businessModule: "通用",
        terminal: "web",
        release: "next",
        industryTerm: false,
        brandLocked: false,
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
      updatedBy: "当前用户",
    };

    return created;
  }

  function createEntry() {
    const project = currentProject.value;
    const created = createEntryDraft();
    if (!project || !created) {
      return undefined;
    }

    project.entries.unshift(created);
    addActivity("新增词条", created.key);
    return created;
  }

  function replaceEntry(entry: TranslationEntry) {
    const project = currentProject.value;
    if (!project) {
      return;
    }

    const index = project.entries.findIndex((item) => item.id === entry.id);
    const updated = {
      ...cloneEntry(entry),
      group: entry.group || groupFromKey(entry.key),
      updatedAt: nowIso(),
      updatedBy: "当前用户",
    };
    updated.status = inferStatus(updated, sourceLocale.value);

    if (index >= 0) {
      project.entries[index] = updated;
    } else {
      project.entries.unshift(updated);
    }
    addActivity("保存词条", updated.key);
  }

  function updateTranslation(entryId: string, locale: LocaleCode, value: string) {
    const project = currentProject.value;
    const entry = project?.entries.find((item) => item.id === entryId);
    if (!entry) {
      return;
    }

    entry.translations[locale] = value;
    if (locale === sourceLocale.value) {
      entry.source = value;
    }
    entry.updatedAt = nowIso();
    entry.updatedBy = "当前用户";
    entry.status = inferStatus(entry, sourceLocale.value);
  }

  function updateStatus(entryId: string, status: EntryStatus) {
    const entry = currentProject.value?.entries.find((item) => item.id === entryId);
    if (!entry) {
      return;
    }
    entry.status = status;
    entry.updatedAt = nowIso();
    addActivity("状态流转", `${entry.key} -> ${status}`);
  }

  function deleteEntries(ids: string[]) {
    const project = currentProject.value;
    if (!project || ids.length === 0) {
      return;
    }

    const keys = project.entries
      .filter((entry) => ids.includes(entry.id))
      .map((entry) => entry.key);
    project.entries = project.entries.filter((entry) => !ids.includes(entry.id));
    state.value.selectedEntryIds = state.value.selectedEntryIds.filter((id) => !ids.includes(id));
    addActivity("删除词条", keys.join(", "));
  }

  function duplicateEntries(ids: string[]) {
    const project = currentProject.value;
    if (!project || ids.length === 0) {
      return;
    }

    const existing = new Set(project.entries.map((entry) => entry.key));
    const duplicated = project.entries
      .filter((entry) => ids.includes(entry.id))
      .map((entry) => {
        const key = randomKey(existing);
        existing.add(key);
        return {
          ...cloneEntry(entry),
          id: createId("entry"),
          key,
          group: entry.group,
          status: "draft" as EntryStatus,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          updatedBy: "当前用户",
        };
      });

    project.entries.unshift(...duplicated);
    addActivity("批量复制", `${duplicated.length} 条词条`);
  }

  function migrateGroup(ids: string[], group: string) {
    const project = currentProject.value;
    if (!project || !group.trim()) {
      return;
    }

    for (const entry of project.entries) {
      if (ids.includes(entry.id)) {
        entry.group = group.trim();
        entry.updatedAt = nowIso();
      }
    }
    addActivity("批量迁移分组", group.trim());
  }

  function deprecateEntries(ids: string[]) {
    const project = currentProject.value;
    if (!project) {
      return;
    }

    for (const entry of project.entries) {
      if (ids.includes(entry.id)) {
        entry.status = "deprecated";
        entry.updatedAt = nowIso();
      }
    }
    addActivity("批量作废下线", `${ids.length} 条词条`);
  }

  async function autoTranslateEntry(entryId: string, overwrite = true) {
    const project = currentProject.value;
    const entry = project?.entries.find((item) => item.id === entryId);
    if (!project || !entry) {
      return;
    }

    machineBusy.value = true;
    try {
      let changedCount = 0;
      for (const locale of project.locales.filter((item) => item.enabled && !item.source)) {
        const changed = await translateEntryLocale(
          entry,
          locale.code,
          project,
          sourceLocale.value,
          state.value.machineProvider,
          overwrite,
        );
        if (changed) {
          changedCount += 1;
        }
      }
      if (changedCount) {
        addActivity("机器翻译填充", `${entry.key} · ${providerNames[state.value.machineProvider]}`);
      }
    } finally {
      machineBusy.value = false;
    }
  }

  async function autoTranslateSelected(
    options: AutoTranslateOptions = {},
  ): Promise<AutoTranslateResult> {
    const project = currentProject.value;
    const selectedIds = options.ids ?? state.value.selectedEntryIds;
    const targetIds = selectedIds.length
      ? selectedIds
      : filteredEntries.value.map((entry) => entry.id);
    const targetLocales = options.locales?.length
      ? options.locales
      : (project?.locales.filter((item) => item.enabled && !item.source).map((item) => item.code) ??
        []);
    const result: AutoTranslateResult = {
      changedCount: 0,
      requestedCount: targetIds.length * targetLocales.length,
      skippedCount: 0,
      locales: targetLocales,
    };

    if (!project || !targetIds.length || !targetLocales.length) {
      result.skippedCount = result.requestedCount;
      return result;
    }

    const enabledTargetLocales = new Set(
      project.locales.filter((item) => item.enabled && !item.source).map((item) => item.code),
    );
    const locales = targetLocales.filter((locale) => enabledTargetLocales.has(locale));
    result.requestedCount = targetIds.length * locales.length;
    result.locales = locales;

    machineBusy.value = true;
    try {
      for (const id of targetIds) {
        const entry = project.entries.find((item) => item.id === id);
        if (!entry) {
          result.skippedCount += locales.length;
          continue;
        }

        for (const locale of locales) {
          const changed = await translateEntryLocale(
            entry,
            locale,
            project,
            sourceLocale.value,
            state.value.machineProvider,
            options.overwrite ?? false,
          );

          if (changed) {
            result.changedCount += 1;
          } else {
            result.skippedCount += 1;
          }
        }
      }

      if (result.changedCount) {
        addActivity(
          "批量机器翻译",
          `${result.changedCount}/${result.requestedCount} 处译文 · ${locales.join(", ")} · ${
            providerNames[state.value.machineProvider]
          }`,
        );
      }

      return result;
    } finally {
      machineBusy.value = false;
    }
  }

  function validateEntry(
    entry: TranslationEntry,
    locale = state.value.filters.locale,
  ): EntryValidation[] {
    const validations: EntryValidation[] = [];
    const value = entry.translations[locale] ?? "";

    if (entry.maxLength && value.length > entry.maxLength) {
      validations.push({
        type: "warning",
        message: `${locale} 长度 ${value.length}/${entry.maxLength}，移动端按钮或弹窗可能被截断`,
      });
    }

    const project = currentProject.value;
    if (!project) {
      return validations;
    }

    for (const term of project.glossary) {
      const target = term.target[locale];
      const sourceUsesTerm = entry.source.includes(term.source);
      const translationUsesForbidden = Boolean(
        target && value.toLowerCase().includes(target.toLowerCase()),
      );
      const sourceUsesForbidden = entry.source.includes(term.source);

      if (
        term.type === "standard" &&
        sourceUsesTerm &&
        target &&
        !value.toLowerCase().includes(target.toLowerCase())
      ) {
        validations.push({
          type: "error",
          message: `术语冲突：${term.source} 必须译为 ${target}`,
        });
      }

      if (term.type === "forbidden" && (sourceUsesForbidden || translationUsesForbidden)) {
        validations.push({
          type: "error",
          message: `禁用术语：${term.source}${target ? ` / ${target}` : ""}`,
        });
      }
    }

    return validations;
  }

  async function importFile(file: File, format: ImportFormat, locale: LocaleCode) {
    const project = currentProject.value;
    if (!project) {
      return;
    }

    importBusy.value = true;
    const task: ImportTask = {
      id: createId("task"),
      filename: file.name,
      format,
      locale,
      status: "running",
      progress: 20,
      imported: 0,
      message: "正在解析文件",
      createdAt: nowIso(),
    };
    project.importTasks.unshift(task);

    try {
      const text = await file.text();
      task.progress = 60;
      const importedEntries = parseImportedEntries(text, format, locale);
      for (const imported of importedEntries) {
        const existing = project.entries.find((entry) => entry.key === imported.key);
        if (existing) {
          existing.translations[locale] = imported.value;
          existing.notes = imported.notes || existing.notes;
          existing.updatedAt = nowIso();
          existing.status = inferStatus(existing, sourceLocale.value);
          continue;
        }

        const translations = Object.fromEntries(project.locales.map((item) => [item.code, ""]));
        translations[locale] = imported.value;
        if (locale === sourceLocale.value) {
          translations[sourceLocale.value] = imported.value;
        }

        project.entries.push({
          id: createId("entry"),
          key: imported.key,
          group: imported.group || groupFromKey(imported.key),
          source: locale === sourceLocale.value ? imported.value : "",
          translations,
          status: "draft",
          tags: ["导入"],
          notes: imported.notes ?? "",
          maxLength: terminalLengthHints.web,
          meta: {
            businessModule: "导入任务",
            terminal: "web",
            release: "next",
            industryTerm: false,
            brandLocked: false,
          },
          createdAt: nowIso(),
          updatedAt: nowIso(),
          updatedBy: "当前用户",
        });
      }

      task.progress = 100;
      task.imported = importedEntries.length;
      task.status = "done";
      task.message = `已导入 ${importedEntries.length} 条`;
      addActivity("导入词条", file.name);
    } catch (error) {
      task.status = "failed";
      task.progress = 100;
      task.message = error instanceof Error ? error.message : "导入失败";
    } finally {
      importBusy.value = false;
    }
  }

  function exportEntries(format: ExportFormat, locale: LocaleCode) {
    const project = currentProject.value;
    if (!project) {
      return;
    }

    const content = serializeEntries(project.entries, locale, format);
    const extension =
      format === "android-xml"
        ? "xml"
        : format === "ios-xcstrings"
          ? "xcstrings"
          : format === "ios-strings"
            ? "strings"
            : format === "yaml"
              ? "yaml"
              : format;
    const filename = `${project.name.replace(/\s+/g, "-").toLowerCase()}-${locale}.${extension}`;
    const target = project.exportTargets.find(
      (item) => item.format === format && item.locale === locale,
    );
    if (target) {
      target.status = "done";
      target.updatedAt = nowIso();
    } else {
      project.exportTargets.unshift({
        id: createId("export"),
        name: filename,
        format,
        locale,
        status: "done",
        updatedAt: nowIso(),
      });
    }
    addActivity("导出资源", filename);
    downloadText(filename, content);
  }

  function addLocale(code: string, name: string) {
    const project = currentProject.value;
    const trimmedCode = code.trim();
    if (!project || !trimmedCode || project.locales.some((locale) => locale.code === trimmedCode)) {
      return;
    }

    project.locales.push({
      code: trimmedCode,
      name: name.trim() || trimmedCode,
      enabled: true,
      source: false,
    });
    for (const entry of project.entries) {
      entry.translations[trimmedCode] = "";
    }
    addActivity("新增语种", trimmedCode);
  }

  function updateLocale(code: string, patch: Partial<LocaleConfig>) {
    const project = currentProject.value;
    if (!project) {
      return;
    }

    if (patch.source) {
      for (const locale of project.locales) {
        locale.source = locale.code === code;
      }
    }

    const locale = project.locales.find((item) => item.code === code);
    if (locale) {
      Object.assign(locale, patch);
      if (locale.source) {
        locale.enabled = true;
      }
    }
  }

  function addTerm(term: Omit<GlossaryTerm, "id">) {
    const project = currentProject.value;
    if (!project || !term.source.trim()) {
      return;
    }

    project.glossary.unshift({ ...term, id: createId("term") });
    addActivity("维护术语", term.source);
  }

  function removeTerm(id: string) {
    const project = currentProject.value;
    if (!project) {
      return;
    }

    project.glossary = project.glossary.filter((term) => term.id !== id);
  }

  function addMember(member: Omit<ProjectMember, "id">) {
    const project = currentProject.value;
    if (!project || !member.email.trim()) {
      return;
    }

    project.members.push({ ...member, id: createId("member") });
    addActivity("邀请成员", member.email);
  }

  function updateMemberRole(id: string, role: UserRole) {
    const member = currentProject.value?.members.find((item) => item.id === id);
    if (!member) {
      return;
    }
    member.role = role;
    addActivity("调整成员角色", member.name);
  }

  function resetMockData() {
    state.value = createInitialState();
    if (import.meta.client) {
      localStorage.removeItem(storageKey);
    }
  }

  return {
    projects,
    currentProject,
    sourceLocale,
    enabledLocales,
    groups,
    filters,
    filteredEntries,
    dashboardStats,
    selectedEntryIds,
    machineProvider,
    importBusy: readonly(importBusy),
    machineBusy: readonly(machineBusy),
    setProject,
    setFilter,
    resetFilters,
    setSelectedEntryIds,
    setMachineProvider,
    duplicateProject,
    updateProject,
    deleteProject,
    createEntryDraft,
    createEntry,
    replaceEntry,
    updateTranslation,
    updateStatus,
    deleteEntries,
    duplicateEntries,
    migrateGroup,
    deprecateEntries,
    autoTranslateEntry,
    autoTranslateSelected,
    validateEntry,
    importFile,
    exportEntries,
    addLocale,
    updateLocale,
    addTerm,
    removeTerm,
    addMember,
    updateMemberRole,
    resetMockData,
  };
}
