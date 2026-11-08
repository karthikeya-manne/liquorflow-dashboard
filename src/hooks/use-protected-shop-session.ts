import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { getShopIdOrNull } from "@/lib/currentShop";

/**
 * Client-only guard for shop screens: requires Firebase user + selectedShopId.
 */
export function useProtectedShopSession() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    setShopId(getShopIdOrNull());
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      void navigate({ to: "/login", replace: true });
      return;
    }

    const id = getShopIdOrNull();
    setShopId(id);

    if (!id) {
      void navigate({ to: "/select-shop", replace: true });
    }
  }, [user, isLoading, navigate]);

  const ready = !isLoading && Boolean(user) && Boolean(shopId);

  return { user, shopId, ready, isLoading };
}
