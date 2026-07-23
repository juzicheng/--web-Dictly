import { computed } from "vue";
import type { DictlyUser } from "../types/dictly";

interface LoginPayload {
  username: string;
  password: string;
}

interface AuthResponse {
  user: DictlyUser;
}

export function useAuth() {
  const user = useState<DictlyUser | null>("dictly-auth-user", () => null);
  const loading = useState<boolean>("dictly-auth-loading", () => false);

  const isLoggedIn = computed(() => Boolean(user.value));
  const isAdmin = computed(() => user.value?.role === "admin");

  async function refresh() {
    loading.value = true;
    try {
      const headers = import.meta.server ? useRequestHeaders(["cookie"]) : undefined;
      const response = await $fetch<AuthResponse>("/api/auth/me", { headers });
      user.value = response.user;
      return response.user;
    } catch {
      user.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function login(payload: LoginPayload) {
    loading.value = true;
    try {
      const response = await $fetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: payload,
      });
      user.value = response.user;
      return response.user;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    await $fetch("/api/auth/logout", { method: "POST" });
    user.value = null;
    await navigateTo("/login");
  }

  return {
    user,
    loading,
    isLoggedIn,
    isAdmin,
    refresh,
    login,
    logout,
  };
}
