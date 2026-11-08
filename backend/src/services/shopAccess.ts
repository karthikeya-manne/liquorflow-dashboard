import { ObjectId } from "mongodb";
import { getDb } from "../config/mongo.js";
import type { ShopDoc } from "../types/domain.js";

export async function getAuthorizedShop(shopIdParam: string, uid: string): Promise<ShopDoc> {
  const db = getDb();
  const shops = db.collection<ShopDoc>("shops");

  const byLegacy = await shops.findOne({
    legacyFirestoreId: shopIdParam,
    ownerUid: uid,
  });
  if (byLegacy) return byLegacy;

  if (ObjectId.isValid(shopIdParam)) {
    const byId = await shops.findOne({
      _id: new ObjectId(shopIdParam),
      ownerUid: uid,
    });
    if (byId) return byId;
  }

  throw new Error("SHOP_NOT_FOUND");
}

export function shopPublicId(shop: ShopDoc): string {
  return shop.legacyFirestoreId ?? shop._id.toHexString();
}
