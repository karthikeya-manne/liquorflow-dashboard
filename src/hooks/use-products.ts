import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { isFirebaseConfigured } from "@/lib/firebase";
import { products as mockProducts } from "@/lib/mock-data";
import { seedProductsIfEmpty, subscribeToProducts } from "@/lib/firestore/products";

export function useProducts() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const useFirestore = isFirebaseConfigured() && isAuthenticated && Boolean(user);
  const userId = user?.uid;
  const queryKey = ["products", useFirestore ? userId : "mock"];

  const mockQuery = useQuery({
    queryKey,
    queryFn: async () => mockProducts,
    enabled: !useFirestore,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!useFirestore || !user) return;

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void (async () => {
      try {
        await seedProductsIfEmpty(user.uid);
        if (cancelled) return;

        unsubscribe = subscribeToProducts(
          user.uid,
          (products) => {
            queryClient.setQueryData(queryKey, products);
          },
          (error) => {
            console.error("Firestore products subscription failed:", error);
          },
        );
      } catch (error) {
        console.error("Failed to load products from Firestore:", error);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [useFirestore, userId, queryClient, queryKey]);

  const firestoreProducts = useFirestore ? queryClient.getQueryData<typeof mockProducts>(queryKey) : undefined;

  return {
    products: useFirestore ? (firestoreProducts ?? []) : (mockQuery.data ?? mockProducts),
    isLoading: useFirestore ? firestoreProducts === undefined : mockQuery.isLoading,
    isFromFirestore: useFirestore,
  };
}
