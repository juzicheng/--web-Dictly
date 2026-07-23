import type { H3Event } from "h3";

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "user";
  email: string;
}

export const sessionCookieName = "dictly_session";

const seedUsers = [
  {
    id: "u-user",
    username: "user",
    password: "user123",
    displayName: "普通用户",
    role: "user" as const,
    email: "user@dictly.local",
  },
  {
    id: "u-admin",
    username: "admin",
    password: "admin123",
    displayName: "管理员",
    role: "admin" as const,
    email: "admin@dictly.local",
  },
];

export function validateSeedUser(username: string, password: string) {
  const found = seedUsers.find((user) => user.username === username && user.password === password);
  if (!found) {
    return undefined;
  }

  const { password: _password, ...user } = found;
  return user;
}

export function findSessionUser(id?: string) {
  const found = seedUsers.find((user) => user.id === id);
  if (!found) {
    return undefined;
  }

  const { password: _password, ...user } = found;
  return user;
}

export function getSessionUser(event: H3Event) {
  return findSessionUser(getCookie(event, sessionCookieName));
}
