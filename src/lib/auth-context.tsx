import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { useRouter } from "@tanstack/react-router";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { setRouterAuthState } from "@/lib/auth-types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ssrAuthFallback: AuthContextValue = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => {
    throw new Error("Auth is only available in the browser");
  },
  signUp: async () => {
    throw new Error("Auth is only available in the browser");
  },
  signOut: async () => {
    throw new Error("Auth is only available in the browser");
  },
};

function syncRouterAuth(user: User | null, isLoading: boolean) {
  setRouterAuthState({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setUser(null);
      setIsLoading(false);
      syncRouterAuth(null, false);
      void router.invalidate();
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsLoading(false);
      syncRouterAuth(nextUser, false);
      void router.invalidate();
    });

    return unsubscribe;
  }, [router]);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    if (displayName?.trim()) {
      await updateProfile(credential.user, { displayName: displayName.trim() });
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signOut,
    }),
    [user, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    if (typeof window === "undefined") {
      return ssrAuthFallback;
    }
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
