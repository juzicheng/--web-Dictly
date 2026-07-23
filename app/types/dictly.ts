export type UserRole = "admin" | "user" | "maintainer" | "translator" | "reviewer" | "viewer";

export interface DictlyUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  email: string;
}

export type LocaleCode = string;

export interface LocaleConfig {
  code: LocaleCode;
  name: string;
  enabled: boolean;
  source: boolean;
}

export type EntryStatus =
  | "draft"
  | "translated"
  | "reviewing"
  | "approved"
  | "outdated"
  | "deprecated";

export type TerminalType = "web" | "android" | "ios" | "admin" | "docs";

export interface EntryMeta {
  businessModule: string;
  terminal: TerminalType;
  release: string;
  industryTerm: boolean;
  brandLocked: boolean;
}

export interface TranslationEntry {
  id: string;
  key: string;
  group: string;
  source: string;
  translations: Record<LocaleCode, string>;
  status: EntryStatus;
  tags: string[];
  notes: string;
  maxLength?: number;
  meta: EntryMeta;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export type TermType = "standard" | "forbidden";

export interface GlossaryTerm {
  id: string;
  source: string;
  target: Record<LocaleCode, string>;
  type: TermType;
  description: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface AuditActivity {
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
}

export type ImportFormat =
  | "json"
  | "yaml"
  | "android-xml"
  | "ios-xcstrings"
  | "csv"
  | "ios-strings";
export type ExportFormat =
  | "json"
  | "yaml"
  | "android-xml"
  | "ios-xcstrings"
  | "ios-strings"
  | "csv";
export type MachineProvider = "mymemory" | "local";

export interface ImportTask {
  id: string;
  filename: string;
  format: ImportFormat;
  locale: LocaleCode;
  status: "queued" | "running" | "done" | "failed";
  progress: number;
  imported: number;
  message: string;
  createdAt: string;
}

export interface ExportTarget {
  id: string;
  name: string;
  format: ExportFormat;
  locale: LocaleCode;
  status: "ready" | "exporting" | "done" | "failed";
  updatedAt: string;
}

export interface DictlyProject {
  id: string;
  teamId: string;
  teamName: string;
  name: string;
  description: string;
  modules: string[];
  locales: LocaleConfig[];
  entries: TranslationEntry[];
  glossary: GlossaryTerm[];
  members: ProjectMember[];
  activities: AuditActivity[];
  importTasks: ImportTask[];
  exportTargets: ExportTarget[];
}

export interface WorkspaceFilters {
  query: string;
  locale: LocaleCode;
  status: EntryStatus | "all";
  group: string;
  onlyUntranslated: boolean;
  onlyReviewing: boolean;
  onlyOutdated: boolean;
}

export interface ImportedEntry {
  key: string;
  value: string;
  group?: string;
  notes?: string;
}

export interface EntryValidation {
  type: "warning" | "error";
  message: string;
}
