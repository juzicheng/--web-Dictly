import { sessionCookieName } from "../../utils/auth";

export default defineEventHandler((event) => {
  deleteCookie(event, sessionCookieName, { path: "/" });
  return { ok: true };
});
