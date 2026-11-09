import { redirect } from "@tanstack/react-router";
import { getRouterAuthState, whenAuthReady } from "@/lib/auth-types";

const PUBLIC_PATHS = new Set(["/login"]);

export async function requireAuthBeforeLoad(currentPath: string) {
  if (PUBLIC_PATHS.has(currentPath)) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  await whenAuthReady();

  const auth = getRouterAuthState();
  if (!auth.isAuthenticated) {
    throw redirect({ to: "/login", replace: true });
  }
}
