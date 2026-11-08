import { deleteProduct, listProducts } from "@/lib/api/liquorflow";

export async function removeDuplicateProducts(shopId: string) {
  const products = await listProducts(shopId);
  const seen = new Map<string, string>();

  for (const product of products) {
    const key = product.name.trim().toLowerCase();
    const existingId = seen.get(key);
    if (!existingId) {
      seen.set(key, product.id);
      continue;
    }

    if (Number(product.quantity) === 0) {
      await deleteProduct(shopId, product.id);
    }
  }
}
