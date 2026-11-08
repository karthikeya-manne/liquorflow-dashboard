import type { QueryClient } from "@tanstack/react-query";
import { shopQueryKeys } from "./query-keys";

export function invalidateShopQueries(queryClient: QueryClient, shopId: string): void {
  void queryClient.invalidateQueries({ queryKey: shopQueryKeys.all(shopId) });
}

export function invalidateShopProducts(queryClient: QueryClient, shopId: string): void {
  void queryClient.invalidateQueries({ queryKey: shopQueryKeys.products(shopId) });
}

export function invalidateShopSales(queryClient: QueryClient, shopId: string): void {
  void queryClient.invalidateQueries({ queryKey: shopQueryKeys.sales(shopId) });
}
