import { ObjectId } from "mongodb";
import { getDb } from "../config/mongo.js";
import type { ShopDoc } from "../types/domain.js";
import { shopPublicId } from "./shopAccess.js";
import { syncShopCatalog } from "./syncCatalog.js";

export async function listShopsForUser(uid: string) {
  const db = getDb();
  const shops = await db.collection<ShopDoc>("shops").find({ ownerUid: uid }).toArray();
  return shops.map((shop) => ({
    id: shopPublicId(shop),
    ownerUid: shop.ownerUid,
    ownerEmail: shop.ownerEmail,
    shopName: shop.shopName,
    shopCategory: shop.shopCategory,
    createdAt: shop.createdAt.toISOString(),
  }));
}

export async function getShopForUser(shop: ShopDoc) {
  return {
    id: shopPublicId(shop),
    ownerUid: shop.ownerUid,
    ownerEmail: shop.ownerEmail,
    shopName: shop.shopName,
    shopCategory: shop.shopCategory,
    createdAt: shop.createdAt.toISOString(),
  };
}

export async function createShop(input: {
  ownerUid: string;
  ownerEmail: string;
  shopName: string;
  shopCategory: string;
}) {
  const db = getDb();
  const now = new Date();
  const legacyFirestoreId = new ObjectId().toHexString();

  const shop: ShopDoc = {
    _id: new ObjectId(),
    legacyFirestoreId,
    ownerUid: input.ownerUid,
    ownerEmail: input.ownerEmail,
    shopName: input.shopName,
    shopCategory: input.shopCategory,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<ShopDoc>("shops").insertOne(shop);
  await syncShopCatalog(shop);

  return {
    id: legacyFirestoreId,
    ownerUid: shop.ownerUid,
    ownerEmail: shop.ownerEmail,
    shopName: shop.shopName,
    shopCategory: shop.shopCategory,
    createdAt: shop.createdAt.toISOString(),
  };
}

export async function updateShop(
  shop: ShopDoc,
  patch: { shopName?: string; ownerEmail?: string },
) {
  const db = getDb();
  await db.collection<ShopDoc>("shops").updateOne(
    { _id: shop._id },
    {
      $set: {
        ...patch,
        updatedAt: new Date(),
      },
    },
  );

  const updated = await db.collection<ShopDoc>("shops").findOne({ _id: shop._id });
  if (!updated) throw new Error("SHOP_NOT_FOUND");
  return getShopForUser(updated);
}
