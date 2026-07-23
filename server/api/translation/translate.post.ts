import { getSessionUser } from "../../utils/auth";

interface TranslateBody {
  text?: string;
  sourceLocale?: string;
  targetLocale?: string;
  provider?: "mymemory" | "local";
}

interface MyMemoryResponse {
  responseData?: {
    translatedText?: string;
  };
  responseDetails?: string;
  responseStatus?: number;
}

function normalizeLocale(locale: string) {
  const trimmed = locale.trim();
  if (!trimmed) {
    return "en-US";
  }
  return trimmed;
}

export default defineEventHandler(async (event) => {
  if (!getSessionUser(event)) {
    throw createError({
      statusCode: 401,
      statusMessage: "未登录",
    });
  }

  const body = await readBody<TranslateBody>(event);
  const text = body.text?.trim() ?? "";
  const sourceLocale = normalizeLocale(body.sourceLocale ?? "zh-CN");
  const targetLocale = normalizeLocale(body.targetLocale ?? "en-US");

  if (!text) {
    return {
      translatedText: "",
      provider: "mymemory",
    };
  }

  const response = await $fetch<MyMemoryResponse>("https://api.mymemory.translated.net/get", {
    query: {
      q: text,
      langpair: `${sourceLocale}|${targetLocale}`,
    },
    timeout: 10000,
  });

  if (response.responseStatus && response.responseStatus !== 200) {
    throw createError({
      statusCode: 502,
      statusMessage: response.responseDetails || "翻译服务暂时不可用",
    });
  }

  return {
    translatedText: response.responseData?.translatedText ?? "",
    provider: "mymemory",
  };
});
