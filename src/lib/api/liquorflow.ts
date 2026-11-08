import { apiFetch } from "./client";

export type Shop = {
  id: string;
  ownerUid: string;
  ownerEmail: string;
  shopName: string;
  shopCategory: string;
  createdAt: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
};

export type Sale = {
  id: string;
  productName: string;
  category: string;
  quantity: number;
  price: number;
  profit?: number;
  paymentMethod?: string;
  soldAt: string;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  uploadedAt: string;
  totalProducts: number;
  totalCases: number;
  items: Array<{
    invoiceName?: string;
    inventoryName: string;
    qty: number;
    bottles?: number;
    packQty: number;
    sizeMl?: number;
  }>;
};

export type Order = {
  id: string;
  customerName: string;
  productName: string;
  status: string;
  createdAt: string;
};

export async function listShops(): Promise<Shop[]> {
  const data = await apiFetch<{ shops: Shop[] }>("/api/shops");
  return data.shops;
}

export async function createShop(input: {
  shopName: string;
  shopCategory: string;
}): Promise<Shop> {
  return apiFetch<Shop>("/api/shops", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getShop(shopId: string): Promise<Shop> {
  return apiFetch<Shop>(`/api/shops/${shopId}`);
}

export async function updateShop(
  shopId: string,
  patch: { shopName?: string; ownerEmail?: string },
): Promise<Shop> {
  return apiFetch<Shop>(`/api/shops/${shopId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function syncShopProducts(shopId: string): Promise<void> {
  await apiFetch(`/api/shops/${shopId}/products/sync`, { method: "POST" });
}

export async function listProducts(shopId: string): Promise<Product[]> {
  const data = await apiFetch<{ products: Product[] }>(`/api/shops/${shopId}/products`);
  return data.products;
}

export async function createProduct(
  shopId: string,
  input: { name: string; category: string; price: number; quantity?: number },
): Promise<Product> {
  return apiFetch<Product>(`/api/shops/${shopId}/products`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProduct(
  shopId: string,
  productId: string,
  patch: Partial<Pick<Product, "name" | "category" | "price" | "quantity">>,
): Promise<Product> {
  return apiFetch<Product>(`/api/shops/${shopId}/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteProduct(shopId: string, productId: string): Promise<void> {
  await apiFetch(`/api/shops/${shopId}/products/${productId}`, { method: "DELETE" });
}

export async function listSales(shopId: string): Promise<Sale[]> {
  const data = await apiFetch<{ sales: Sale[] }>(`/api/shops/${shopId}/sales`);
  return data.sales;
}

export async function createSale(
  shopId: string,
  input: {
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod?: string;
    includeProfit?: boolean;
    soldAt?: string;
  },
): Promise<Sale[]> {
  const data = await apiFetch<{ sales: Sale[] }>(`/api/shops/${shopId}/sales`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.sales;
}

export async function saveMorningStock(
  shopId: string,
  lines: Array<{ productId: string; closingQuantity: number; soldQuantity: number }>,
): Promise<void> {
  await apiFetch(`/api/shops/${shopId}/morning-stocks`, {
    method: "POST",
    body: JSON.stringify({ lines }),
  });
}

export async function refillProducts(
  shopId: string,
  items: Array<{ productId: string; refillQty: number }>,
): Promise<void> {
  await apiFetch(`/api/shops/${shopId}/inventory/refill`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export async function listInvoices(shopId: string): Promise<Invoice[]> {
  const data = await apiFetch<{ invoices: Invoice[] }>(`/api/shops/${shopId}/invoices`);
  return data.invoices;
}

export async function importInvoice(
  shopId: string,
  input: { invoiceNumber: string; items: Invoice["items"] },
): Promise<{ totalStock: number }> {
  return apiFetch(`/api/shops/${shopId}/invoices`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteInvoice(
  shopId: string,
  invoiceId: string,
): Promise<{ totalStock: number }> {
  return apiFetch(`/api/shops/${shopId}/invoices/${invoiceId}`, {
    method: "DELETE",
  });
}

export async function listOrders(shopId: string): Promise<Order[]> {
  const data = await apiFetch<{ orders: Order[] }>(`/api/shops/${shopId}/orders`);
  return data.orders;
}

export async function createOrder(
  shopId: string,
  input: { customerName: string; productName: string },
): Promise<Order> {
  return apiFetch<Order>(`/api/shops/${shopId}/orders`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function completeOrder(shopId: string, orderId: string): Promise<Order> {
  return apiFetch<Order>(`/api/shops/${shopId}/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "Completed" }),
  });
}
