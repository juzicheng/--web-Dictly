import type { H3Event } from "h3";

interface SdkLocale {
  code: string;
  name: string;
  enabled: boolean;
  source: boolean;
}

interface SdkEntry {
  key: string;
  source: string;
  status: "draft" | "translated" | "reviewing" | "approved" | "outdated" | "deprecated";
  translations: Record<string, string>;
}

interface SdkProject {
  id: string;
  name: string;
  defaultLocale: string;
  updatedAt: string;
  tokens: string[];
  locales: SdkLocale[];
  entries: SdkEntry[];
}

const sdkProjects: SdkProject[] = [
  {
    id: "happy-app-lang",
    name: "Happy I18n",
    defaultLocale: "zh-CN",
    updatedAt: "2026-07-23T00:00:00.000Z",
    tokens: ["happy-demo-token"],
    locales: [
      { code: "zh-CN", name: "简体中文", enabled: true, source: true },
      { code: "en-US", name: "English", enabled: true, source: false },
      { code: "ja-JP", name: "日本語", enabled: true, source: false },
      { code: "es-ES", name: "Español", enabled: true, source: false },
      { code: "ko-KR", name: "한국어", enabled: true, source: false },
    ],
    entries: [
      {
        key: "app.name",
        source: "Happy",
        status: "approved",
        translations: {
          "zh-CN": "Happy",
          "en-US": "Happy",
          "ja-JP": "Happy",
          "es-ES": "Happy",
          "ko-KR": "Happy",
        },
      },
      {
        key: "home.title",
        source: "欢迎来到 Happy",
        status: "approved",
        translations: {
          "zh-CN": "欢迎来到 Happy",
          "en-US": "Welcome to Happy",
          "ja-JP": "Happy へようこそ",
          "es-ES": "Bienvenido a Happy",
          "ko-KR": "Happy에 오신 것을 환영합니다",
        },
      },
      {
        key: "home.subtitle",
        source: "每天记录一点快乐",
        status: "translated",
        translations: {
          "zh-CN": "每天记录一点快乐",
          "en-US": "Capture a little joy every day",
          "ja-JP": "毎日少しの幸せを記録しましょう",
          "es-ES": "Guarda un poco de alegria cada dia",
          "ko-KR": "매일 작은 행복을 기록하세요",
        },
      },
      {
        key: "common.confirm",
        source: "确认",
        status: "approved",
        translations: {
          "zh-CN": "确认",
          "en-US": "Confirm",
          "ja-JP": "確認",
          "es-ES": "Confirmar",
          "ko-KR": "확인",
        },
      },
      {
        key: "common.cancel",
        source: "取消",
        status: "approved",
        translations: {
          "zh-CN": "取消",
          "en-US": "Cancel",
          "ja-JP": "キャンセル",
          "es-ES": "Cancelar",
          "ko-KR": "취소",
        },
      },
    ],
  },
];

export function readAuthorizedSdkProject(event: H3Event) {
  const id = getRouterParam(event, "id") || "";
  const project = sdkProjects.find((item) => item.id === id);

  if (!project) {
    throw createError({
      statusCode: 404,
      statusMessage: "SDK 项目不存在",
    });
  }

  const token = readToken(event);
  if (!project.tokens.includes(token)) {
    throw createError({
      statusCode: 403,
      statusMessage: "无效 token，SDK 初始化或调用失败",
    });
  }

  return project;
}

export function getSdkProjectManifest(project: SdkProject) {
  return {
    id: project.id,
    name: project.name,
    defaultLocale: project.defaultLocale,
    locales: project.locales.filter((locale) => locale.enabled),
    permissions: ["manifest:read", "translations:pull"],
    updatedAt: project.updatedAt,
  };
}

export function buildSdkTranslations(
  project: SdkProject,
  options: Record<string, unknown>,
): Record<string, Record<string, unknown>> {
  const locales = resolveLocales(project, options.locales);
  const statuses = parseList(options.status);
  const nested = options.nested === "true";
  const fallbackSource = options.fallbackSource !== "false";
  const result: Record<string, Record<string, unknown>> = Object.fromEntries(
    locales.map((locale) => [locale.code, {} as Record<string, unknown>]),
  );
  const entries = project.entries.filter((entry) =>
    statuses?.length ? statuses.includes(entry.status) : entry.status !== "deprecated",
  );

  for (const entry of entries) {
    for (const locale of locales) {
      const value = entry.translations[locale.code] || (fallbackSource ? entry.source : "");
      const localeResult = result[locale.code];

      if (!localeResult) {
        continue;
      }

      if (nested) {
        setNestedValue(localeResult, entry.key, value);
      } else {
        localeResult[entry.key] = value;
      }
    }
  }

  return result;
}

function readToken(event: H3Event) {
  const authorization = getHeader(event, "authorization") || "";

  if (authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return (getHeader(event, "x-dictly-token") || "").trim();
}

function resolveLocales(project: SdkProject, value: unknown): SdkLocale[] {
  const enabledLocales = project.locales.filter((locale) => locale.enabled);
  const requested = parseList(value);

  if (!requested?.length) {
    return enabledLocales;
  }

  return enabledLocales.filter((locale) => requested.includes(locale.code));
}

function parseList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const items = value.flatMap((item) => parseList(item) ?? []);
    return items.length ? items : undefined;
  }

  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function setNestedValue(target: Record<string, unknown>, key: string, value: string) {
  const parts = key.split(".");
  const last = parts.pop();
  let cursor = target;

  for (const part of parts) {
    if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }

    cursor = cursor[part] as Record<string, unknown>;
  }

  if (last) {
    cursor[last] = value;
  }
}
