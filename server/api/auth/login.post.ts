import { sessionCookieName, validateSeedUser } from "../../utils/auth";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ username?: string; password?: string }>(event);
  const user = validateSeedUser(body.username ?? "", body.password ?? "");

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "账号或密码错误",
    });
  }

  setCookie(event, sessionCookieName, user.id, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
  });

  return { user };
});
