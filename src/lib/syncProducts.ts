import { syncShopProducts } from "@/lib/api/liquorflow";

export async function syncProducts(shopId: string) {
  await syncShopProducts(shopId);
}
