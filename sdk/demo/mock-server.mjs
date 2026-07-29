import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

const happyProject = {
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
};

export function startMockServer(options = {}) {
  const port = options.port ?? 3210;
  const server = createServer((request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
    const match = url.pathname.match(/^\/api\/sdk\/projects\/([^/]+)\/(manifest|translations)$/);

    if (!match) {
      return sendJson(response, 404, { statusMessage: "Not Found" });
    }

    const [, projectId, resource] = match;
    if (projectId !== happyProject.id) {
      return sendJson(response, 404, { statusMessage: "项目不存在" });
    }

    if (!isAuthorized(request)) {
      return sendJson(response, 403, { statusMessage: "无效 token，SDK 初始化或调用失败" });
    }

    if (resource === "manifest") {
      return sendJson(response, 200, {
        project: publicManifest(),
        generatedAt: new Date().toISOString(),
      });
    }

    return sendJson(response, 200, {
      project: publicManifest(),
      translations: buildTranslations({
        locales: url.searchParams.get("locales"),
        nested: url.searchParams.get("nested") === "true",
        fallbackSource: url.searchParams.get("fallbackSource") !== "false",
      }),
      generatedAt: new Date().toISOString(),
    });
  });

  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

function isAuthorized(request) {
  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
  return happyProject.tokens.includes(token);
}

function publicManifest() {
  return {
    id: happyProject.id,
    name: happyProject.name,
    defaultLocale: happyProject.defaultLocale,
    locales: happyProject.locales.filter((locale) => locale.enabled),
    permissions: ["manifest:read", "translations:pull"],
    updatedAt: happyProject.updatedAt,
  };
}

function buildTranslations(options) {
  const codes = parseList(options.locales) || publicManifest().locales.map((locale) => locale.code);
  const result = Object.fromEntries(codes.map((code) => [code, {}]));

  for (const entry of happyProject.entries) {
    if (entry.status === "deprecated") {
      continue;
    }

    for (const code of codes) {
      const value = entry.translations[code] || (options.fallbackSource ? entry.source : "");
      if (options.nested) {
        setNestedValue(result[code], entry.key, value);
      } else {
        result[code][entry.key] = value;
      }
    }
  }

  return result;
}

function parseList(value) {
  if (!value) {
    return undefined;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function setNestedValue(target, key, value) {
  const parts = key.split(".");
  const last = parts.pop();
  let cursor = target;

  for (const part of parts) {
    cursor[part] ||= {};
    cursor = cursor[part];
  }

  cursor[last] = value;
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(JSON.stringify(body));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { baseUrl } = await startMockServer({ port: Number(process.env.PORT || 3210) });
  console.log(`Dictly mock server is running at ${baseUrl}`);
  console.log("Project id: happy-app-lang");
  console.log("Token: happy-demo-token");
}
