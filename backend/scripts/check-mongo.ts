import "dotenv/config";
import { MongoClient } from "mongodb";
import { getEnv } from "../src/config/env.js";

async function main() {
  const env = getEnv();
  const redacted = env.MONGODB_URI.replace(/\/\/[^@]+@/, "//***@");
  console.log(`Connecting to ${redacted} (db=${env.MONGODB_DB_NAME})...`);

  const client = new MongoClient(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15_000,
    connectTimeoutMS: 15_000,
  });

  try {
    await client.connect();
    const db = client.db(env.MONGODB_DB_NAME);
    await db.command({ ping: 1 });
    console.log("OK — MongoDB is reachable.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("FAILED:", message);
    if (/SSL routines|tlsv1 alert/i.test(message)) {
      console.error(`
Atlas checklist:
  • Network Access → Add IP Address → "Add Current IP" (or 0.0.0.0/0 for dev)
  • Database → cluster not paused
  • Database Access → password matches MONGODB_URI (special chars must be URL-encoded)
  • MongoDB Compass on this PC with the same URI

Local dev workaround: run MongoDB on this machine and set
  MONGODB_URI=mongodb://127.0.0.1:27017
`);
    }
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => undefined);
  }
}

void main();
