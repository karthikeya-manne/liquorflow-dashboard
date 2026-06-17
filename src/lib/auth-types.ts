import type { User } from "firebase/auth";

export type RouterAuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};

let routerAuthState: RouterAuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

export function setRouterAuthState(partial: Partial<RouterAuthState>) {
  routerAuthState = { ...routerAuthState, ...partial };
}

export function getRouterAuthState(): RouterAuthState {
  return routerAuthState;
}

export type RouterAuthContext = {
  readonly user: User | null;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
};

export const defaultRouterAuthContext: RouterAuthContext = {
  get user() {
    return routerAuthState.user;
  },
  get isLoading() {
    return routerAuthState.isLoading;
  },
  get isAuthenticated() {
    return routerAuthState.isAuthenticated;
  },
};
