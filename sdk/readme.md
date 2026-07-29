# Dictly SDK

Dictly SDK 用于给第三方应用拉取 Dictly 项目里的多语言资源。第三方应用拿到 Dictly 项目 id 和授权 token 后，可以初始化 SDK，并把该项目配置的所有启用语种导出为本地 JSON 文件。

示例项目：

- 应用：`Happy`
- Dictly 翻译项目：`Happy I18n`
- 项目 id：`happy-app-lang`
- demo token：`happy-demo-token`

## 接入方式

### 本地源码接入

当前 SDK 是一个独立 ESM 包，可以直接从本仓库引用：

```js
import { Dictly } from "./sdk/src/index.js";

const dictly = new Dictly({
  id: "happy-app-lang",
  token: "happy-demo-token",
  baseUrl: "http://localhost:3000",
});

await dictly.init();
await dictly.pull({ outputDir: "src/locales" });
```

### 发布为 npm 包后接入

```bash
npm install @dictly/sdk
```

```js
import { Dictly } from "@dictly/sdk";

const dictly = new Dictly({
  id: "happy-app-lang",
  token: "这里写入 Happy 向 Dictly 申请的权限 token",
  baseUrl: "https://dictly.example.com",
});

await dictly.init();
await dictly.pull({ outputDir: "src/locales" });
```

### 浏览器接入

浏览器环境可以拉取翻译对象，但不能直接写入使用者项目文件。浏览器里使用 `getTranslations()` 或 `exportJson()`，文件生成请放在 Node.js 构建脚本、CLI、CI 流程里。

```html
<script type="module">
  import { Dictly } from "https://cdn.example.com/@dictly/sdk/src/index.js";

  const dictly = new Dictly({
    id: "happy-app-lang",
    token: "happy-demo-token",
    baseUrl: "https://dictly.example.com"
  });

  await dictly.init();
  const translations = await dictly.getTranslations();
  console.log(translations["zh-CN"]);
</script>
```

## 快速 demo

SDK 目录内置了一个 mock server，不需要先启动 Nuxt。

```bash
cd sdk
npm run demo
```

运行后会在 `sdk/demo/locales/` 生成：

- `zh-CN.json`
- `en-US.json`
- `ja-JP.json`
- `es-ES.json`
- `ko-KR.json`

也可以单独启动 mock server：

```bash
cd sdk
npm run mock
```

然后使用：

```js
const dictly = new Dictly({
  id: "happy-app-lang",
  token: "happy-demo-token",
  baseUrl: "http://127.0.0.1:3210",
});
```

## 鉴权规则

SDK 不在客户端保存授权列表。`id/token` 会被带到 Dictly 服务端校验：

- `id` 不存在：初始化失败。
- `token` 不在该项目授权列表内：初始化失败。
- 一旦某个 SDK 实例收到 `401` 或 `403`，该实例会进入不可用状态，后续 API 会直接抛出 `DICTLY_AUTH_FAILED`。
- 如果需要换 token，调用 `setToken(newToken)` 后重新 `init()`。

请求头：

```http
Authorization: Bearer <token>
X-Dictly-Project-Id: <id>
```

当前项目内置示例服务端接口：

- `GET /api/sdk/projects/:id/manifest`
- `GET /api/sdk/projects/:id/translations`

## API

### `new Dictly(options)`

```ts
const dictly = new Dictly({
  id: "happy-app-lang",
  token: "happy-demo-token",
  baseUrl: "https://dictly.example.com",
  outputDir: "src/locales",
  timeout: 10000,
});
```

参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | Dictly 翻译项目 id |
| `token` | `string` | 是 | 第三方应用申请到的项目授权 token |
| `baseUrl` | `string` | 否 | Dictly 服务地址，默认浏览器同源或 `http://localhost:3000` |
| `outputDir` | `string` | 否 | `pull()` 默认输出目录，默认 `locales` |
| `timeout` | `number` | 否 | 请求超时时间，默认 `10000` ms |
| `fetcher` | `typeof fetch` | 否 | 自定义 fetch 实现 |
| `headers` | `Record<string, string>` | 否 | 附加请求头 |

### `await dictly.init()`

校验项目和 token，并拉取项目 manifest。

返回：

```ts
{
  id: "happy-app-lang",
  name: "Happy I18n",
  defaultLocale: "zh-CN",
  locales: [
    { code: "zh-CN", name: "简体中文", enabled: true, source: true }
  ],
  permissions: ["manifest:read", "translations:pull"]
}
```

### `await dictly.pull(options?)`

Node.js 专用。拉取所有启用语种，并在指定目录生成 JSON 文件。

```js
await dictly.pull({
  outputDir: "src/locales",
  nested: false,
  pretty: true,
});
```

如果 Happy I18n 配了 5 个启用语种，就会生成 5 个 JSON 文件。

常用参数：

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `outputDir` | `string` | 构造函数里的 `outputDir` | 输出目录 |
| `locales` | `string[]` | 全部启用语种 | 只拉取指定语种 |
| `nested` | `boolean` | `false` | 是否把 `home.title` 转成 `{ home: { title } }` |
| `fallbackSource` | `boolean` | `true` | 目标语种为空时是否回退源文案 |
| `status` | `string \| string[]` | 非 `deprecated` | 只导出指定状态词条 |
| `fileName` | `string \| (locale) => string` | `[locale].json` | 文件名，字符串多语种时需包含 `[locale]` |
| `overwrite` | `boolean` | `true` | 是否覆盖已有文件 |

返回：

```ts
{
  projectId: "happy-app-lang",
  projectName: "Happy I18n",
  outputDir: "/absolute/path/src/locales",
  files: [
    { locale: "zh-CN", path: "/absolute/path/src/locales/zh-CN.json", entryCount: 5, bytes: 128 }
  ],
  generatedAt: "2026-07-23T00:00:00.000Z"
}
```

### `await dictly.getTranslations(options?)`

拉取翻译对象，不写入文件。适合浏览器、SSR 或自定义构建流程。

```js
const translations = await dictly.getTranslations({
  locales: ["zh-CN", "en-US"],
  nested: true,
});

console.log(translations["en-US"].home.title);
```

### `await dictly.exportJson(options?)`

返回每个语种对应的 JSON 字符串。

```js
const jsonMap = await dictly.exportJson({ locales: ["en-US"] });
console.log(jsonMap["en-US"]);
```

### `await dictly.getManifest({ force?: boolean })`

读取项目 manifest。`force: true` 会重新请求服务端。

### `dictly.isReady()`

返回当前实例是否已经初始化且未被鉴权失败锁定。

### `dictly.setToken(token)`

更换 token，并清空当前初始化状态。之后需要重新执行 `init()`。

### `dictly.setBaseUrl(baseUrl)`

更换 Dictly 服务地址，并清空当前初始化状态。

### `dictly.on(event, handler)`

支持事件：

| 事件 | 触发时机 |
| --- | --- |
| `init` | 初始化成功 |
| `pull` | 文件生成成功 |
| `error` | 请求、鉴权或写文件失败 |

```js
const off = dictly.on("pull", (result) => {
  console.log(result.files);
});

off();
```

## 支持平台

| 平台 | 支持情况 | 说明 |
| --- | --- | --- |
| Node.js 18+ | 完整支持 | 支持 `init`、`getTranslations`、`exportJson`、`pull` |
| Vite / Nuxt / Vue / React 构建脚本 | 完整支持 | 推荐在构建前或 CI 中执行 `pull` |
| 浏览器现代环境 | 部分支持 | 支持拉取数据，不支持本地文件写入 |
| CI/CD | 完整支持 | 可在发布前生成 locale JSON |
| 小程序 / React Native | 未直接适配 | 可复用 HTTP 协议，文件写入需要平台侧适配 |

## 服务端接口协议

### Manifest

```http
GET /api/sdk/projects/happy-app-lang/manifest
Authorization: Bearer happy-demo-token
```

返回：

```json
{
  "project": {
    "id": "happy-app-lang",
    "name": "Happy I18n",
    "defaultLocale": "zh-CN",
    "locales": [
      { "code": "zh-CN", "name": "简体中文", "enabled": true, "source": true }
    ],
    "permissions": ["manifest:read", "translations:pull"]
  }
}
```

### Translations

```http
GET /api/sdk/projects/happy-app-lang/translations?locales=zh-CN,en-US&nested=false
Authorization: Bearer happy-demo-token
```

返回：

```json
{
  "translations": {
    "zh-CN": {
      "home.title": "欢迎来到 Happy"
    },
    "en-US": {
      "home.title": "Welcome to Happy"
    }
  }
}
```

## 错误码

| 错误码 | 含义 |
| --- | --- |
| `DICTLY_INVALID_OPTIONS` | 初始化参数不合法 |
| `DICTLY_FETCH_UNAVAILABLE` | 当前环境没有 fetch |
| `DICTLY_AUTH_FAILED` | 项目不存在、token 无效或无权限 |
| `DICTLY_API_ERROR` | Dictly 服务端返回非鉴权错误 |
| `DICTLY_TIMEOUT` | 请求超时 |
| `DICTLY_NETWORK_ERROR` | 网络请求失败 |
| `DICTLY_INVALID_RESPONSE` | 服务端响应格式不符合 SDK 协议 |
| `DICTLY_UNSUPPORTED_RUNTIME` | 当前环境不支持该 API，例如浏览器调用 `pull()` |
| `DICTLY_INVALID_FILENAME` | 多语种输出文件名配置不合法 |
| `DICTLY_FILE_EXISTS` | `overwrite: false` 且目标文件已存在 |

## 实际效果

```js
const dictly = new Dictly({
  id: "happy-app-lang",
  token: "happy-demo-token",
  baseUrl: "http://localhost:3000",
});

await dictly.init();
await dictly.pull({ outputDir: "src/locales" });
```

生成：

```txt
src/locales/
  zh-CN.json
  en-US.json
  ja-JP.json
  es-ES.json
  ko-KR.json
```

`en-US.json` 示例：

```json
{
  "app.name": "Happy",
  "home.title": "Welcome to Happy",
  "home.subtitle": "Capture a little joy every day",
  "common.confirm": "Confirm",
  "common.cancel": "Cancel"
}
```
