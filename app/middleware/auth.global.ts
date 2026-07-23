const publicPaths = new Set(["/login"]);

export default defineNuxtRouteMiddleware(async (to) => {
  if (publicPaths.has(to.path)) {
    const auth = useAuth();
    if (!auth.user.value) {
      await auth.refresh();
    }
    if (auth.user.value && to.path === "/login") {
      return navigateTo("/");
    }
    return;
  }

  const auth = useAuth();
  if (!auth.user.value) {
    await auth.refresh();
  }

  if (!auth.user.value) {
    return navigateTo({
      path: "/login",
      query: { redirect: to.fullPath },
    });
  }
});
