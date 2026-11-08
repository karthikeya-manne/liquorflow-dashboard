import { MongoClient, type Db } from "mongodb";
import { getEnv } from "./env.js";

let client: MongoClient | undefined;
let db: Db | undefined;

export async function connectMongo(): Promise<Db> {
  if (db) return db;

  const env = getEnv();
  client = new MongoClient(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
  });
  await client.connect();
  db = client.db(env.MONGODB_DB_NAME);
  await ensureIndexes(db);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error("MongoDB is not connected. Call connectMongo() first.");
  }
  return db;
}

export async function disconnectMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

async function ensureIndexes(database: Db): Promise<void> {
  await database.collection("shops").createIndex({ ownerUid: 1 });
  await database.collection("shops").createIndex({ legacyFirestoreId: 1 }, { unique: true, sparse: true });

  await database.collection("products").createIndex({ shopId: 1, name: 1 });
  await database.collection("products").createIndex(
    { shopId: 1, legacyFirestoreId: 1 },
    { unique: true, sparse: true },
  );

  await database.collection("sales").createIndex({ shopId: 1, soldAt: -1 });
  await database.collection("sales").createIndex(
    { shopId: 1, legacyFirestoreId: 1 },
    { unique: true, sparse: true },
  );

  await database.collection("invoiceHistory").createIndex({ shopId: 1, uploadedAt: -1 });
  await database.collection("invoiceHistory").createIndex(
    { shopId: 1, invoiceNumber: 1 },
    { unique: true },
  );

  await database.collection("orders").createIndex({ shopId: 1, createdAt: -1 });

  await database.collection("migrationIdMappings").createIndex({ firestorePath: 1 }, { unique: true });
}
