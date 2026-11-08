import { redirect } from "@tanstack/react-router";
import { getRouterAuthState } from "@/lib/auth-types";

const PUBLIC_PATHS = new Set(["/login"]);

export function requireAuthBeforeLoad(currentPath: string) {
  if (PUBLIC_PATHS.has(currentPath)) {
    return;
  }

  const auth = getRouterAuthState();
  if (auth.isLoading) {
    return;
  }
  if (!auth.isAuthenticated) {
    throw redirect({ to: "/login" });
  }
}
