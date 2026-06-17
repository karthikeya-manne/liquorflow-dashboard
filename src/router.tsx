import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { defaultRouterAuthContext } from "@/lib/auth-types";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient, auth: defaultRouterAuthContext },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
