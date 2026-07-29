const DEFAULT_TIMEOUT = 10000;
const DEFAULT_BASE_URL = "http://localhost:3000";

export class DictlyError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = "DictlyError";
    this.code = code;
    this.status = options.status;
    this.details = options.details;
    this.cause = options.cause;
  }
}

export class Dictly {
  constructor(options) {
    if (!options || typeof options !== "object") {
      throw new DictlyError("DICTLY_INVALID_OPTIONS", "Dictly 初始化参数不能为空。");
    }

    this.id = requireText(options.id, "id");
    this.token = requireText(options.token, "token");
    this.baseUrl = normalizeBaseUrl(options.baseUrl || getDefaultBaseUrl());
    this.timeout = normalizeTimeout(options.timeout);
    this.outputDir = options.outputDir || "locales";
    this.fetcher = options.fetcher || globalThis.fetch;
    this.headers = { ...(options.headers || {}) };
    this.manifest = null;
    this.initialized = false;
    this.blocked = false;
    this.listeners = new Map();

    if (typeof this.fetcher !== "function") {
      throw new DictlyError(
        "DICTLY_FETCH_UNAVAILABLE",
        "当前运行环境没有 fetch，请升级到 Node.js 18+ 或在 options.fetcher 中传入 fetch 实现。",
      );
    }
  }

  isReady() {
    return this.initialized && !this.blocked;
  }

  on(event, handler) {
    if (typeof handler !== "function") {
      throw new DictlyError("DICTLY_INVALID_HANDLER", "事件监听器必须是函数。");
    }

    const handlers = this.listeners.get(event) || new Set();
    handlers.add(handler);
    this.listeners.set(event, handlers);

    return () => this.off(event, handler);
  }

  off(event, handler) {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    handlers.delete(handler);
    if (!handlers.size) {
      this.listeners.delete(event);
    }
  }

  setToken(token) {
    this.token = requireText(token, "token");
    this.initialized = false;
    this.blocked = false;
    this.manifest = null;
  }

  setBaseUrl(baseUrl) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.initialized = false;
    this.manifest = null;
  }

  async init() {
    this.assertUsable();

    const payload = await this.request(`/api/sdk/projects/${encodeURIComponent(this.id)}/manifest`);
    this.manifest = normalizeManifest(payload);
    this.initialized = true;
    this.emit("init", this.manifest);

    return this.manifest;
  }

  async getManifest(options = {}) {
    if (options.force || !this.manifest || !this.initialized) {
      return this.init();
    }

    this.assertUsable();
    return this.manifest;
  }

  async getTranslations(options = {}) {
    await this.ensureInitialized();

    const payload = await this.request(`/api/sdk/projects/${encodeURIComponent(this.id)}/translations`, {
      query: {
        locales: serializeList(options.locales),
        status: serializeList(options.status),
        nested: options.nested ? "true" : undefined,
        fallbackSource: options.fallbackSource === false ? "false" : undefined,
      },
    });

    return normalizeTranslations(payload, options);
  }

  async exportJson(options = {}) {
    const translations = await this.getTranslations(options);
    const space = options.pretty === false ? 0 : 2;

    return Object.fromEntries(
      Object.entries(translations).map(([locale, entries]) => [locale, JSON.stringify(entries, null, space)]),
    );
  }

  async pull(options = {}) {
    assertNodeRuntime();
    await this.ensureInitialized();

    const translations = await this.getTranslations(options);
    const localeEntries = Object.entries(translations);
    const outputDir = options.outputDir || this.outputDir;

    if (
      typeof options.fileName === "string" &&
      options.fileName.trim() &&
      !options.fileName.includes("[locale]") &&
      localeEntries.length > 1
    ) {
      throw new DictlyError(
        "DICTLY_INVALID_FILENAME",
        "pull 多语种文件时，fileName 字符串必须包含 [locale] 占位符。",
      );
    }

    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const root = path.resolve(getCwd(), outputDir);
    await fs.mkdir(root, { recursive: true });

    const files = [];
    const space = options.pretty === false ? 0 : 2;

    for (const [locale, entries] of localeEntries) {
      const fileName = resolveFileName(options.fileName, locale);
      const filePath = path.resolve(root, fileName);

      if (!filePath.startsWith(root + path.sep) && filePath !== root) {
        throw new DictlyError("DICTLY_INVALID_PATH", `生成文件路径越界：${fileName}`);
      }

      if (options.overwrite === false && (await exists(fs, filePath))) {
        throw new DictlyError("DICTLY_FILE_EXISTS", `文件已存在：${filePath}`);
      }

      const content = `${JSON.stringify(entries, null, space)}${options.newline === false ? "" : "\n"}`;
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf8");

      files.push({
        locale,
        path: filePath,
        bytes: byteLength(content),
        entryCount: countEntries(entries),
      });
    }

    const result = {
      projectId: this.manifest.id,
      projectName: this.manifest.name,
      outputDir: root,
      files,
      generatedAt: new Date().toISOString(),
    };
    this.emit("pull", result);

    return result;
  }

  async ensureInitialized() {
    this.assertUsable();

    if (!this.initialized) {
      await this.init();
    }
  }

  async request(pathname, options = {}) {
    this.assertUsable();

    const url = createRequestUrl(this.baseUrl, pathname, options.query);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await this.fetcher(url, {
        method: options.method || "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.token}`,
          "X-Dictly-Project-Id": this.id,
          ...this.headers,
          ...(options.headers || {}),
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      const payload = await parseResponse(response);

      if (!response.ok) {
        const message = readErrorMessage(payload) || `Dictly API 请求失败：${response.status}`;
        const code = response.status === 401 || response.status === 403 ? "DICTLY_AUTH_FAILED" : "DICTLY_API_ERROR";
        const error = new DictlyError(code, message, {
          status: response.status,
          details: payload,
        });

        if (code === "DICTLY_AUTH_FAILED") {
          this.blocked = true;
          this.initialized = false;
        }

        this.emit("error", error);
        throw error;
      }

      return payload;
    } catch (error) {
      if (error instanceof DictlyError) {
        throw error;
      }

      const code = error?.name === "AbortError" ? "DICTLY_TIMEOUT" : "DICTLY_NETWORK_ERROR";
      const message =
        code === "DICTLY_TIMEOUT"
          ? `Dictly API 请求超时，当前 timeout=${this.timeout}ms。`
          : `Dictly API 网络请求失败：${error?.message || String(error)}`;
      const dictlyError = new DictlyError(code, message, { cause: error });
      this.emit("error", dictlyError);
      throw dictlyError;
    } finally {
      clearTimeout(timer);
    }
  }

  assertUsable() {
    if (this.blocked) {
      throw new DictlyError(
        "DICTLY_AUTH_FAILED",
        "当前 Dictly 实例鉴权已失败。请创建新实例，或调用 setToken() 后重新 init()。",
      );
    }
  }

  emit(event, payload) {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    for (const handler of handlers) {
      handler(payload);
    }
  }
}

export default Dictly;

function getDefaultBaseUrl() {
  return globalThis.location?.origin || DEFAULT_BASE_URL;
}

function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new DictlyError("DICTLY_INVALID_OPTIONS", `Dictly 参数 ${field} 必须是非空字符串。`);
  }

  return value.trim();
}

function normalizeBaseUrl(baseUrl) {
  const value = requireText(baseUrl, "baseUrl");
  return value.replace(/\/+$/, "");
}

function normalizeTimeout(timeout) {
  if (timeout === undefined) {
    return DEFAULT_TIMEOUT;
  }

  const value = Number(timeout);
  if (!Number.isFinite(value) || value <= 0) {
    throw new DictlyError("DICTLY_INVALID_OPTIONS", "timeout 必须是大于 0 的数字。");
  }

  return value;
}

function serializeList(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return Array.isArray(value) ? value.join(",") : String(value);
}

function createRequestUrl(baseUrl, pathname, query = {}) {
  const url = new URL(`${baseUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("json") || /^[\[{]/.test(text.trim())) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return text;
}

function readErrorMessage(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  return payload.message || payload.statusMessage || payload.error || "";
}

function normalizeManifest(payload) {
  const project = payload?.project || payload;
  if (!project || typeof project !== "object") {
    throw new DictlyError("DICTLY_INVALID_RESPONSE", "Dictly manifest 响应格式不正确。");
  }

  return {
    id: String(project.id || ""),
    name: String(project.name || project.id || ""),
    defaultLocale: String(project.defaultLocale || project.sourceLocale || ""),
    locales: Array.isArray(project.locales) ? project.locales : [],
    permissions: Array.isArray(project.permissions) ? project.permissions : [],
    updatedAt: project.updatedAt,
  };
}

function normalizeTranslations(payload, options) {
  const source = payload?.translations || payload;
  if (source && typeof source === "object" && !Array.isArray(source)) {
    const translations = {};

    for (const [locale, entries] of Object.entries(source)) {
      if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
        continue;
      }

      translations[locale] = options.nested ? toNested(entries) : entries;
    }

    if (Object.keys(translations).length) {
      return translations;
    }
  }

  if (Array.isArray(payload?.entries)) {
    return entriesToTranslations(payload.entries, payload.project?.locales || [], options);
  }

  throw new DictlyError("DICTLY_INVALID_RESPONSE", "Dictly translations 响应格式不正确。");
}

function entriesToTranslations(entries, locales, options) {
  const codes = (options.locales?.length ? options.locales : locales.map((locale) => locale.code)).filter(Boolean);
  const result = Object.fromEntries(codes.map((code) => [code, {}]));

  for (const entry of entries) {
    if (!entry?.key || entry.status === "deprecated") {
      continue;
    }

    for (const code of codes) {
      const value = entry.translations?.[code] || (options.fallbackSource === false ? "" : entry.source || "");
      if (options.nested) {
        setNestedValue(result[code], entry.key, value);
      } else {
        result[code][entry.key] = value;
      }
    }
  }

  return result;
}

function toNested(entries) {
  if (Object.values(entries).some((value) => value && typeof value === "object")) {
    return entries;
  }

  const result = {};
  for (const [key, value] of Object.entries(entries)) {
    setNestedValue(result, key, value);
  }

  return result;
}

function setNestedValue(target, key, value) {
  const parts = String(key).split(".").filter(Boolean);
  const last = parts.pop();
  let cursor = target;

  for (const part of parts) {
    if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }

    cursor = cursor[part];
  }

  if (last) {
    cursor[last] = value;
  }
}

function resolveFileName(fileName, locale) {
  if (typeof fileName === "function") {
    return fileName(locale);
  }

  if (typeof fileName === "string" && fileName.trim()) {
    return fileName.replaceAll("[locale]", locale);
  }

  return `${locale}.json`;
}

async function exists(fs, filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function assertNodeRuntime() {
  if (typeof process === "undefined" || !process.versions?.node) {
    throw new DictlyError("DICTLY_UNSUPPORTED_RUNTIME", "pull() 只能在 Node.js 环境写入本地文件。");
  }
}

function getCwd() {
  if (typeof process === "undefined" || typeof process.cwd !== "function") {
    throw new DictlyError("DICTLY_UNSUPPORTED_RUNTIME", "当前环境不支持读取工作目录。");
  }

  return process.cwd();
}

function byteLength(value) {
  return typeof Buffer === "undefined" ? value.length : Buffer.byteLength(value, "utf8");
}

function countEntries(value) {
  if (!value || typeof value !== "object") {
    return 0;
  }

  return Object.values(value).reduce((total, child) => {
    if (child && typeof child === "object" && !Array.isArray(child)) {
      return total + countEntries(child);
    }

    return total + 1;
  }, 0);
}
