import "dotenv/config";
import { createApp } from "./app.js";
import { initFirebaseAdmin } from "./config/firebase.js";
import { getEnv } from "./config/env.js";
import { connectMongo } from "./config/mongo.js";

async function main() {
  console.log("LiquorFlow API starting…");

  const env = getEnv();
  console.log(
    `Environment OK (firebase=${env.FIREBASE_PROJECT_ID}, db=${env.MONGODB_DB_NAME}, port=${env.PORT})`,
  );

  initFirebaseAdmin();
  console.log("Firebase Admin initialized");

  await connectMongo();
  console.log("MongoDB connected");

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
  1. Atlas → Network Access → Allow Access from Anywhere (0.0.0.0/0) so Render can connect.
  2. Atlas → Database: cluster is running (not paused).
  3. Render → Environment: MONGODB_URI matches Atlas (copy a fresh connection string if needed).
  4. Database Access: user password in the URI is correct.`;
  }

  if (/Invalid environment configuration/i.test(message)) {
    return `${message}

Render → Environment: set MONGODB_URI, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and CLIENT_ORIGIN.`;
  }

  if (/private key|PEM|credential/i.test(message)) {
    return `${redacted}

Firebase private key issue. On Render, paste the full multiline secret (BEGIN…END) or use \\n between lines in FIREBASE_PRIVATE_KEY.`;
  }

  return redacted;
}

main().catch((err) => {
  console.error("Failed to start server:", safeStartupError(err));
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", safeStartupError(reason));
  process.exit(1);
});
