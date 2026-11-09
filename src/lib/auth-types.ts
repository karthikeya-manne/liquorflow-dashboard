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

let authReady = false;
const authReadyWaiters: Array<() => void> = [];

/** Resolves after the first Firebase auth state (signed in or signed out). */
export function whenAuthReady(): Promise<void> {
  if (authReady) return Promise.resolve();
  return new Promise((resolve) => {
    authReadyWaiters.push(resolve);
  });
}

function markAuthReady() {
  if (authReady) return;
  authReady = true;
  for (const resolve of authReadyWaiters) resolve();
  authReadyWaiters.length = 0;
}

export function setRouterAuthState(partial: Partial<RouterAuthState>) {
  routerAuthState = { ...routerAuthState, ...partial };
  if (partial.isLoading === false) {
    markAuthReady();
  }
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
