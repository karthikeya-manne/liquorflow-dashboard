import { ObjectId } from "mongodb";
import { getDb } from "../config/mongo.js";
import type { ProductDoc, ShopDoc } from "../types/domain.js";
import { defaultProducts } from "../data/defaultProducts.js";
import { walkInProducts } from "../data/walkInProducts.js";

type CatalogProduct = {
  name: string;
  category: string;
  price: number;
};

export async function syncShopCatalog(shop: ShopDoc): Promise<void> {
  const catalog: CatalogProduct[] =
    shop.shopCategory === "Walk-in" ? walkInProducts : defaultProducts;

  const db = getDb();
  const collection = db.collection<ProductDoc>("products");
  const existing = await collection.find({ shopId: shop._id }).toArray();

  const now = new Date();

  for (const product of catalog) {
    const match = existing.find(
      (p) => p.name.trim().toLowerCase() === product.name.trim().toLowerCase(),
    );

    if (!match) {
      await collection.insertOne({
        _id: new ObjectId(),
        shopId: shop._id,
        legacyFirestoreId: new ObjectId().toHexString(),
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: 0,
        createdAt: now,
        updatedAt: now,
      });
      continue;
    }

    if (match.price !== product.price || match.category !== product.category) {
      await collection.updateOne(
        { _id: match._id },
        {
          $set: {
            price: product.price,
            category: product.category,
            updatedAt: now,
          },
        },
      );
    }
  }

  const refreshed = await collection.find({ shopId: shop._id }).toArray();
  for (const firestoreProduct of refreshed) {
    const existsInDefault = catalog.some(
      (product) =>
        product.name.trim().toLowerCase() === firestoreProduct.name.trim().toLowerCase(),
    );

    if (!existsInDefault && Number(firestoreProduct.quantity) === 0) {
      await collection.deleteOne({ _id: firestoreProduct._id });
    }
  }
}
