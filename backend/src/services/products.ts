import { ObjectId } from "mongodb";
import { getDb } from "../config/mongo.js";
import type { ProductDoc, ShopDoc } from "../types/domain.js";
import { toApiProduct } from "./productMapper.js";

export async function listProducts(shop: ShopDoc) {
  const db = getDb();
  const products = await db
    .collection<ProductDoc>("products")
    .find({ shopId: shop._id })
    .toArray();
  return products.map(toApiProduct);
}

export async function findProductInShop(shop: ShopDoc, productId: string): Promise<ProductDoc | null> {
  const db = getDb();
  const collection = db.collection<ProductDoc>("products");

  const byLegacy = await collection.findOne({
    shopId: shop._id,
    legacyFirestoreId: productId,
  });
  if (byLegacy) return byLegacy;

  if (ObjectId.isValid(productId)) {
    return collection.findOne({
      shopId: shop._id,
      _id: new ObjectId(productId),
    });
  }

  return null;
}

export async function createProduct(
  shop: ShopDoc,
  input: { name: string; category: string; price: number; quantity?: number },
) {
  const db = getDb();
  const now = new Date();
  const doc: ProductDoc = {
    _id: new ObjectId(),
    shopId: shop._id,
    name: input.name.trim(),
    category: input.category,
    price: input.price,
    quantity: input.quantity ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<ProductDoc>("products").insertOne(doc);
  return toApiProduct(doc);
}

export async function updateProduct(
  shop: ShopDoc,
  productId: string,
  patch: Partial<Pick<ProductDoc, "name" | "category" | "price" | "quantity">>,
) {
  const existing = await findProductInShop(shop, productId);
  if (!existing) throw new Error("SHOP_NOT_FOUND");

  const db = getDb();
  await db.collection<ProductDoc>("products").updateOne(
    { _id: existing._id, shopId: shop._id },
    {
      $set: {
        ...patch,
        updatedAt: new Date(),
      },
    },
  );

  const updated = await db.collection<ProductDoc>("products").findOne({ _id: existing._id });
  if (!updated) throw new Error("SHOP_NOT_FOUND");
  return toApiProduct(updated);
}

export async function deleteProduct(shop: ShopDoc, productId: string): Promise<void> {
  const existing = await findProductInShop(shop, productId);
  if (!existing) throw new Error("SHOP_NOT_FOUND");
  const db = getDb();
  await db.collection<ProductDoc>("products").deleteOne({ _id: existing._id, shopId: shop._id });
}

export async function adjustProductQuantity(
  shop: ShopDoc,
  productId: string,
  delta: number,
  session?: import("mongodb").ClientSession,
): Promise<ProductDoc> {
  const existing = await findProductInShop(shop, productId);
  if (!existing) throw new Error("SHOP_NOT_FOUND");

  const nextQty = Number(existing.quantity) + delta;
  if (nextQty < 0) throw new Error("INSUFFICIENT_STOCK");

  const db = getDb();
  await db.collection<ProductDoc>("products").updateOne(
    { _id: existing._id, shopId: shop._id },
    { $set: { quantity: nextQty, updatedAt: new Date() } },
    session ? { session } : undefined,
  );

  return { ...existing, quantity: nextQty };
}

export async function setProductQuantity(
  shop: ShopDoc,
  productId: string,
  quantity: number,
  session?: import("mongodb").ClientSession,
): Promise<void> {
  const existing = await findProductInShop(shop, productId);
  if (!existing) throw new Error("SHOP_NOT_FOUND");
  if (quantity < 0) throw new Error("INSUFFICIENT_STOCK");

  const db = getDb();
  await db.collection<ProductDoc>("products").updateOne(
    { _id: existing._id, shopId: shop._id },
    { $set: { quantity, updatedAt: new Date() } },
    session ? { session } : undefined,
  );
}
