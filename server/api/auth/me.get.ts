import { getSessionUser } from "../../utils/auth";

export default defineEventHandler((event) => {
  const user = getSessionUser(event);

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "未登录",
    });
  }

  return { user };
});
