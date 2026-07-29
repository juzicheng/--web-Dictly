import { expect, test } from "@playwright/test";
import { loginRequest, users } from "./helpers/auth";

test.describe("服务端接口冒烟", () => {
  test("@smoke auth/me 未登录返回 401", async ({ request }) => {
    const response = await request.get("/api/auth/me");

    expect(response.status()).toBe(401);
  });

  test("@smoke 可以登录、读取当前用户并退出", async ({ request }) => {
    await loginRequest(request);

    const me = await request.get("/api/auth/me");
    expect(me.ok()).toBeTruthy();
    await expect(me).toBeOK();
    await expect(await me.json()).toMatchObject({
      user: {
        username: users.user.username,
        displayName: users.user.displayName,
        email: users.user.email,
      },
    });

    const logout = await request.post("/api/auth/logout");
    expect(logout.ok()).toBeTruthy();

    const afterLogout = await request.get("/api/auth/me");
    expect(afterLogout.status()).toBe(401);
  });

  test("错误账号密码返回 401", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: {
        username: "user",
        password: "bad-password",
      },
    });

    expect(response.status()).toBe(401);
  });

  test("@smoke SDK manifest 需要有效 token", async ({ request }) => {
    const unauthorized = await request.get("/api/sdk/projects/happy-app-lang/manifest");
    expect(unauthorized.status()).toBe(403);

    const response = await request.get("/api/sdk/projects/happy-app-lang/manifest", {
      headers: {
        authorization: "Bearer happy-demo-token",
      },
    });

    await expect(response).toBeOK();
    await expect(await response.json()).toMatchObject({
      project: {
        id: "happy-app-lang",
        name: "Happy I18n",
        defaultLocale: "zh-CN",
        permissions: ["manifest:read", "translations:pull"],
      },
    });
  });

  test("SDK translations 支持 locale、status 和 nested 查询", async ({ request }) => {
    const response = await request.get("/api/sdk/projects/happy-app-lang/translations", {
      headers: {
        "x-dictly-token": "happy-demo-token",
      },
      params: {
        locales: "en-US,ja-JP",
        status: "approved",
        nested: "true",
      },
    });

    await expect(response).toBeOK();
    const body = await response.json();

    expect(body.translations["en-US"].app.name).toBe("Happy");
    expect(body.translations["en-US"].home.title).toBe("Welcome to Happy");
    expect(body.translations["en-US"].home.subtitle).toBeUndefined();
    expect(body.translations["ja-JP"].common.confirm).toBe("確認");
  });

  test("SDK 项目不存在时返回 404", async ({ request }) => {
    const response = await request.get("/api/sdk/projects/missing-project/manifest", {
      headers: {
        authorization: "Bearer happy-demo-token",
      },
    });

    expect(response.status()).toBe(404);
  });

  test("翻译接口未登录返回 401，登录后空文本不会访问外部服务", async ({ request }) => {
    const unauthorized = await request.post("/api/translation/translate", {
      data: {
        text: "登录",
        sourceLocale: "zh-CN",
        targetLocale: "en-US",
      },
    });
    expect(unauthorized.status()).toBe(401);

    await loginRequest(request);
    const response = await request.post("/api/translation/translate", {
      data: {
        text: "",
        sourceLocale: "zh-CN",
        targetLocale: "en-US",
      },
    });

    await expect(response).toBeOK();
    await expect(await response.json()).toMatchObject({
      translatedText: "",
      provider: "mymemory",
    });
  });
});
