import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { isApiEnabled } from "@/lib/api/client";
import { listProducts } from "@/lib/api/liquorflow";
import { shopQueryKeys } from "@/lib/api/query-keys";
import { products as mockProducts, type Product } from "@/lib/mock-data";
import { getCurrentShopId } from "@/lib/currentShop";

function mapApiProductToMockShape(
  item: { id: string; name: string; category: string; quantity: number; price: number },
): Product {
  return {
    id: item.id,
    name: item.name,
    category: item.category as Product["category"],
    sku: item.id,
    stock: item.quantity,
    threshold: 5,
    price: item.price,
    cost: 0,
    supplier: "",
  };
}

function resolveShopId(): string | null {
  try {
    return getCurrentShopId();
  } catch {
    return null;
  }
}

export function useProducts() {
  const { isAuthenticated } = useAuth();
  const shopId = resolveShopId();
  const useApi = isApiEnabled() && isAuthenticated && Boolean(shopId);

  const apiQuery = useQuery({
    queryKey: shopQueryKeys.products(shopId ?? "none"),
    queryFn: async () => {
      if (!shopId) return [];
      const items = await listProducts(shopId);
      return items.map(mapApiProductToMockShape);
    },
    enabled: useApi,
  });

  const mockQuery = useQuery({
    queryKey: ["products", "mock"],
    queryFn: async () => mockProducts,
    enabled: !useApi,
    staleTime: Infinity,
  });

  const products = useApi ? (apiQuery.data ?? []) : (mockQuery.data ?? mockProducts);

  return {
    products,
    isLoading: useApi ? apiQuery.isLoading : mockQuery.isLoading,
    isFromFirestore: false,
    isFromApi: useApi,
  };
}
