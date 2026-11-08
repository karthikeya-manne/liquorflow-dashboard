export const shopQueryKeys = {
  all: (shopId: string) => ["liquorflow", shopId] as const,
  products: (shopId: string) => ["liquorflow", shopId, "products"] as const,
  sales: (shopId: string) => ["liquorflow", shopId, "sales"] as const,
  invoices: (shopId: string) => ["liquorflow", shopId, "invoices"] as const,
  orders: (shopId: string) => ["liquorflow", shopId, "orders"] as const,
  shop: (shopId: string) => ["liquorflow", shopId, "shop"] as const,
  shops: () => ["liquorflow", "shops"] as const,
};
