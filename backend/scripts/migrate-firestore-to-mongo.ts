/**
 * Firestore → MongoDB migration (read-only on Firestore).
 *
 * Usage (from backend/):
 *   npm run migrate -- --dry-run
 *   npm run migrate
 *   npm run migrate -- --collection=shops
 */
import "dotenv/config";
import admin from "firebase-admin";
import { MongoClient, ObjectId } from "mongodb";
import { getEnv } from "../src/config/env.js";

type Stats = {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
};

const stats: Record<string, Stats> = {};

function bump(collection: string, field: keyof Stats) {
  if (!stats[collection]) {
    stats[collection] = { inserted: 0, updated: 0, skipped: 0, failed: 0 };
  }
  stats[collection][field]++;
}

function parseArgs() {
  const dryRun = process.argv.includes("--dry-run");
  const collectionArg = process.argv.find((a) => a.startsWith("--collection="));
  const collection = collectionArg?.split("=")[1];
  return { dryRun, collection };
}

function toDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === "string") return new Date(value);
  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "object" && value !== null && "_seconds" in value) {
    const seconds = (value as { _seconds: number })._seconds;
    return new Date(seconds * 1000);
  }
  return new Date();
}

async function main() {
  const { dryRun, collection: onlyCollection } = parseArgs();
  const env = getEnv();

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });

  const firestore = admin.firestore();
  const mongo = new MongoClient(env.MONGODB_URI);
  await mongo.connect();
  const db = mongo.db(env.MONGODB_DB_NAME);

  const mappings = db.collection("migrationIdMappings");
  const shopsCol = db.collection("shops");

  const shopIdByFirestore = new Map<string, ObjectId>();

  async function mapPath(firestorePath: string, mongoId: ObjectId) {
    if (dryRun) return;
    await mappings.updateOne(
      { firestorePath },
      { $set: { mongoId: mongoId.toHexString(), updatedAt: new Date() } },
      { upsert: true },
    );
  }

  async function migrateShops() {
    if (onlyCollection && onlyCollection !== "shops") return;
    const snapshot = await firestore.collection("shops").get();

    for (const doc of snapshot.docs) {
      const firestoreId = doc.id;
      const data = doc.data();

      try {
        const existing = await shopsCol.findOne({ legacyFirestoreId: firestoreId });
        if (existing) {
          shopIdByFirestore.set(firestoreId, existing._id);
          bump("shops", "skipped");
          continue;
        }

        const shop = {
          _id: new ObjectId(),
          legacyFirestoreId: firestoreId,
          ownerUid: String(data.ownerUid ?? ""),
          ownerEmail: String(data.ownerEmail ?? ""),
          shopName: String(data.shopName ?? ""),
          shopCategory: String(data.shopCategory ?? "Wines"),
          createdAt: toDate(data.createdAt),
          updatedAt: new Date(),
        };

        if (!dryRun) {
          await shopsCol.insertOne(shop);
          await mapPath(`shops/${firestoreId}`, shop._id);
        }
        shopIdByFirestore.set(firestoreId, shop._id);
        bump("shops", "inserted");
      } catch (err) {
        console.error(`shops/${firestoreId} failed:`, err);
        bump("shops", "failed");
      }
    }
  }

  async function resolveShopId(firestoreShopId: string): Promise<ObjectId | null> {
    if (shopIdByFirestore.has(firestoreShopId)) {
      return shopIdByFirestore.get(firestoreShopId)!;
    }
    const found = await shopsCol.findOne({ legacyFirestoreId: firestoreShopId });
    if (found) {
      shopIdByFirestore.set(firestoreShopId, found._id);
      return found._id;
    }
    return null;
  }

  async function migrateSubcollection(
    name: "products" | "sales" | "invoiceHistory" | "orders",
    mapDoc: (
      shopId: ObjectId,
      firestoreShopId: string,
      id: string,
      data: admin.firestore.DocumentData,
    ) => Record<string, unknown>,
  ) {
    if (onlyCollection && onlyCollection !== name) return;

    const shopSnap = await firestore.collection("shops").get();
    const target = db.collection(name === "invoiceHistory" ? "invoiceHistory" : name);

    for (const shopDoc of shopSnap.docs) {
      const firestoreShopId = shopDoc.id;
      const shopId = await resolveShopId(firestoreShopId);
      if (!shopId) {
        console.warn(`Skipping ${name} for unknown shop ${firestoreShopId}`);
        continue;
      }

      const sub = await firestore.collection("shops").doc(firestoreShopId).collection(name).get();
      for (const doc of sub.docs) {
        const path = `shops/${firestoreShopId}/${name}/${doc.id}`;
        try {
          const existing = await target.findOne({ shopId, legacyFirestoreId: doc.id });
          if (existing) {
            bump(name, "skipped");
            continue;
          }

          const mapped = mapDoc(shopId, firestoreShopId, doc.id, doc.data());
          if (!dryRun) {
            await target.insertOne(mapped);
            await mapPath(path, mapped._id as ObjectId);
          }
          bump(name, "inserted");
        } catch (err) {
          console.error(`${path} failed:`, err);
          bump(name, "failed");
        }
      }
    }
  }

  console.log(`Starting migration (dryRun=${dryRun})...`);
  await migrateShops();

  await migrateSubcollection("products", (shopId, _shopFs, id, data) => ({
    _id: new ObjectId(),
    shopId,
    legacyFirestoreId: id,
    name: String(data.name ?? ""),
    category: String(data.category ?? "Others"),
    quantity: Number(data.quantity ?? 0),
    price: Number(data.price ?? 0),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await migrateSubcollection("sales", (shopId, _shopFs, id, data) => ({
    _id: new ObjectId(),
    shopId,
    legacyFirestoreId: id,
    productName: String(data.productName ?? ""),
    category: String(data.category ?? "Others"),
    quantity: Number(data.quantity ?? 0),
    price: Number(data.price ?? 0),
    profit: data.profit !== undefined ? Number(data.profit) : undefined,
    paymentMethod: data.paymentMethod ? String(data.paymentMethod) : undefined,
    soldAt: toDate(data.soldAt),
  }));

  await migrateSubcollection("invoiceHistory", (shopId, _shopFs, id, data) => ({
    _id: new ObjectId(),
    shopId,
    legacyFirestoreId: id,
    invoiceNumber: String(data.invoiceNumber ?? ""),
    uploadedAt: toDate(data.uploadedAt),
    totalProducts: Number(data.totalProducts ?? 0),
    totalCases: Number(data.totalCases ?? 0),
    items: Array.isArray(data.items) ? data.items : [],
  }));

  await migrateSubcollection("orders", (shopId, _shopFs, id, data) => ({
    _id: new ObjectId(),
    shopId,
    legacyFirestoreId: id,
    customerName: String(data.customerName ?? ""),
    productName: String(data.productName ?? ""),
    status: String(data.status ?? "Pending"),
    createdAt: toDate(data.createdAt),
  }));

  const productCount = await db.collection("products").countDocuments();
  const salesCount = await db.collection("sales").countDocuments();
  const shopCount = await db.collection("shops").countDocuments();

  console.log("\n=== Migration summary ===");
  console.table(stats);
  console.log({ shopCount, productCount, salesCount, dryRun });

  await mongo.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
