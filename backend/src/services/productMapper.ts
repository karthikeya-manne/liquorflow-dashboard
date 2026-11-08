import type { ProductDoc } from "../types/domain.js";
import type { ApiProduct } from "../types/domain.js";

export function toApiProduct(product: ProductDoc): ApiProduct {
  return {
    id: product.legacyFirestoreId ?? product._id.toHexString(),
    name: product.name,
    category: product.category,
    quantity: product.quantity,
    price: product.price,
  };
}
