export type DictlyEvent = "init" | "pull" | "error";

export interface DictlyLocale {
  code: string;
  name: string;
  enabled: boolean;
  source: boolean;
}

export interface DictlyManifest {
  id: string;
  name: string;
  defaultLocale: string;
  locales: DictlyLocale[];
  permissions: string[];
  updatedAt?: string;
}

export interface DictlyOptions {
  id: string;
  token: string;
  baseUrl?: string;
  outputDir?: string;
  timeout?: number;
  fetcher?: typeof fetch;
  headers?: Record<string, string>;
}

export interface GetManifestOptions {
  force?: boolean;
}

export interface TranslationOptions {
  locales?: string[];
  status?: string | string[];
  nested?: boolean;
  fallbackSource?: boolean;
}

export type TranslationMap = Record<string, Record<string, unknown>>;

export interface ExportJsonOptions extends TranslationOptions {
  pretty?: boolean;
}

export interface PullOptions extends ExportJsonOptions {
  outputDir?: string;
  fileName?: string | ((locale: string) => string);
  overwrite?: boolean;
  newline?: boolean;
}

export interface PulledFile {
  locale: string;
  path: string;
  bytes: number;
  entryCount: number;
}

export interface PullResult {
  projectId: string;
  projectName: string;
  outputDir: string;
  files: PulledFile[];
  generatedAt: string;
}

export class DictlyError extends Error {
  name: "DictlyError";
  code: string;
  status?: number;
  details?: unknown;
  cause?: unknown;

  constructor(
    code: string,
    message: string,
    options?: {
      status?: number;
      details?: unknown;
      cause?: unknown;
    },
  );
}

export class Dictly {
  readonly id: string;
  token: string;
  baseUrl: string;
  timeout: number;
  outputDir: string;
  manifest: DictlyManifest | null;
  initialized: boolean;

  constructor(options: DictlyOptions);

  isReady(): boolean;
  on(event: "init", handler: (manifest: DictlyManifest) => void): () => void;
  on(event: "pull", handler: (result: PullResult) => void): () => void;
  on(event: "error", handler: (error: DictlyError) => void): () => void;
  off(event: DictlyEvent, handler: (...args: any[]) => void): void;
  setToken(token: string): void;
  setBaseUrl(baseUrl: string): void;
  init(): Promise<DictlyManifest>;
  getManifest(options?: GetManifestOptions): Promise<DictlyManifest>;
  getTranslations(options?: TranslationOptions): Promise<TranslationMap>;
  exportJson(options?: ExportJsonOptions): Promise<Record<string, string>>;
  pull(options?: PullOptions): Promise<PullResult>;
}

export default Dictly;
