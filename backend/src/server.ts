import "dotenv/config";
import { createApp } from "./app.js";
import { initFirebaseAdmin } from "./config/firebase.js";
import { getEnv } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";

async function main() {
  initFirebaseAdmin();
  await connectMongo();

  const env = getEnv();
  const app = createApp();

  app.listen(env.PORT, env.HOST, () => {
    console.log(
      `LiquorFlow API listening on ${env.HOST}:${env.PORT} (db=${env.MONGODB_DB_NAME}, firebase=${env.FIREBASE_PROJECT_ID})`,
    );
  });
}

function safeStartupError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const redacted = message
    .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, "[mongodb-uri-redacted]")
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, "[private-key-redacted]");

  if (/SSL routines|tlsv1 alert|MongoServerSelectionError/i.test(message)) {
    return `${redacted}

MongoDB Atlas connection failed. Check:
  1. Atlas → Network Access: add your current IP (or 0.0.0.0/0 for local dev only).
  2. Atlas → Database: cluster is running (not paused).
  3. Database Access: user password matches MONGODB_URI in backend/.env (reset password and update .env if unsure).
  4. Test the same URI in MongoDB Compass from this PC.`;
  }

  return redacted;
}

main().catch((err) => {
  console.error("Failed to start server:", safeStartupError(err));
  process.exit(1);
});
